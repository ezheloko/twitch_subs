import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const avatarBases = await prisma.avatarBase.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        avatars: true,
      },
    })

    return NextResponse.json(avatarBases)
  } catch (error) {
    console.error("Error fetching avatar bases:", error)
    return NextResponse.json(
      { error: "Failed to fetch avatar bases" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()

    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      )
    }

    const avatarBase = await prisma.avatarBase.create({
      data: {
        imageUrl,
      },
    })

    return NextResponse.json(avatarBase, { status: 201 })
  } catch (error: any) {
    console.error("Error creating avatar base:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create avatar base" },
      { status: 500 }
    )
  }
}
