import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import sharp from "sharp"

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

    const bytes = await file.arrayBuffer()
    let buffer: Buffer = Buffer.from(bytes)

    // Создаем директорию если её нет
    const uploadDir = join(process.cwd(), "public", "uploads", type)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `${timestamp}-${originalName}`
    const filepath = join(uploadDir, filename)

    // Обрабатываем фоны: нормализуем ширину до 1920px
    if (type === "background") {
      const image = sharp(buffer)
      const metadata = await image.metadata()
      const currentWidth = metadata.width || 0
      const currentHeight = metadata.height || 0
      const targetWidth = 1920

      if (currentWidth > targetWidth) {
        // Уменьшаем до 1920px, сохраняя пропорции
        buffer = (await image
          .resize(targetWidth, null, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toBuffer()) as Buffer
      } else if (currentWidth < targetWidth) {
        // Добавляем черные поля слева и справа
        const paddingLeft = Math.floor((targetWidth - currentWidth) / 2)
        const paddingRight = targetWidth - currentWidth - paddingLeft

        buffer = (await image
          .extend({
            top: 0,
            bottom: 0,
            left: paddingLeft,
            right: paddingRight,
            background: { r: 0, g: 0, b: 0 }, // Черный цвет
          })
          .toBuffer()) as Buffer
      }
      // Если currentWidth === targetWidth, оставляем как есть
    }

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
