import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

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
    const buffer = Buffer.from(bytes)

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
