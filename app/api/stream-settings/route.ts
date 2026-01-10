import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    let settings = await prisma.streamSettings.findFirst()

    // Если настроек нет, создаем дефолтные
    if (!settings) {
      settings = await prisma.streamSettings.create({
        data: {
          slideDuration: 15,
          transitionType: "none",
        },
      })
      // Если был другой тип перехода, сбрасываем на none или fade
      if (settings.transitionType !== "none" && settings.transitionType !== "fade") {
        settings = await prisma.streamSettings.update({
          where: { id: settings.id },
          data: { transitionType: "none" },
        })
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching stream settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch stream settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()

    const { slideDuration, transitionType, streamUrl } = body

    let settings = await prisma.streamSettings.findFirst()

    if (!settings) {
      settings = await prisma.streamSettings.create({
        data: {
          slideDuration: slideDuration || 15,
          transitionType: transitionType || "none",
          streamUrl,
        },
      })
    } else {
      const updateData: any = {}
      if (slideDuration !== undefined) updateData.slideDuration = slideDuration
      // Разрешаем только none или fade
      if (transitionType === "none" || transitionType === "fade") {
        updateData.transitionType = transitionType
      } else {
        updateData.transitionType = "none" // По умолчанию none
      }
      if (streamUrl !== undefined) updateData.streamUrl = streamUrl

      settings = await prisma.streamSettings.update({
        where: { id: settings.id },
        data: updateData,
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error("Error updating stream settings:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update stream settings" },
      { status: 500 }
    )
  }
}
