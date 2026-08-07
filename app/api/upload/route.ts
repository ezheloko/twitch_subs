import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import sharp from "sharp"

// Только растровые форматы: SVG/HTML исключены, чтобы загрузка не могла
// превратиться в хранимый XSS через отдающуюся как статика разметку.
const ALLOWED_MIME_TO_FORMAT: Record<string, "png" | "jpeg" | "webp" | "gif"> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "image/gif": "gif",
}

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024 // 15MB

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // "background", "avatar", "furniture"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!type || !["background", "avatar", "furniture"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'background', 'avatar', or 'furniture'" },
        { status: 400 }
      )
    }

    const outputFormat = ALLOWED_MIME_TO_FORMAT[file.type]
    if (!outputFormat) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PNG, JPEG, WEBP, GIF" },
        { status: 400 }
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Max size is 15MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const inputBuffer = Buffer.from(bytes)

    let image = sharp(inputBuffer, { failOn: "error" })
    let metadata
    try {
      metadata = await image.metadata()
    } catch {
      return NextResponse.json(
        { error: "Invalid or corrupted image file" },
        { status: 400 }
      )
    }

    // Обрабатываем фоны: нормализуем ширину до 1920px
    if (type === "background") {
      const currentWidth = metadata.width || 0
      const targetWidth = 1920

      if (currentWidth > targetWidth) {
        // Уменьшаем до 1920px, сохраняя пропорции
        image = image.resize(targetWidth, null, {
          fit: "inside",
          withoutEnlargement: true,
        })
      } else if (currentWidth < targetWidth) {
        // Добавляем черные поля слева и справа
        const paddingLeft = Math.floor((targetWidth - currentWidth) / 2)
        const paddingRight = targetWidth - currentWidth - paddingLeft

        image = image.extend({
          top: 0,
          bottom: 0,
          left: paddingLeft,
          right: paddingRight,
          background: { r: 0, g: 0, b: 0 }, // Черный цвет
        })
      }
      // Если currentWidth === targetWidth, оставляем размер как есть
    }

    // Все файлы, вне зависимости от типа, перекодируются заново через sharp -
    // это гарантирует, что на диск попадут только настоящие декодированные
    // пиксели, а не произвольные байты под видом картинки.
    const buffer = (await image.toFormat(outputFormat).toBuffer()) as Buffer

    // Создаем директорию если её нет
    const uploadDir = join(process.cwd(), "public", "uploads", type)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const originalBaseName = file.name
      .replace(/\.[^.]*$/, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${timestamp}-${originalBaseName}.${outputFormat}`
    const filepath = join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const url = `/uploads/${type}/${filename}`

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
