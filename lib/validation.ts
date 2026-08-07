import { z } from "zod"
import { NextResponse } from "next/server"

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: "Invalid request body", details: z.treeifyError(error) },
    { status: 400 }
  )
}

export const roomCreateSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  backgroundUrl: z.string().trim().min(1, "backgroundUrl is required"),
})

export const roomUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  backgroundUrl: z.string().trim().min(1).optional(),
  orderNumber: z.number().int().optional(),
})

export const avatarCreateSchema = z.object({
  roomId: z.string().trim().min(1),
  avatarBaseId: z.string().trim().min(1),
  imageUrl: z.string().trim().min(1),
  username: z.string().trim().min(1),
  twitchUrl: z.string().trim().min(1).optional(),
  userpicUrl: z.string().trim().min(1).nullable().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  layerIndex: z.number().int().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  subscriptionDate: z.union([z.string(), z.date()]).optional(),
})

export const avatarUpdateSchema = z.object({
  username: z.string().trim().min(1).optional(),
  twitchUrl: z.string().trim().min(1).optional(),
  userpicUrl: z.string().trim().min(1).nullable().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  layerIndex: z.number().int().optional(),
  isLocked: z.boolean().optional(),
  isActive: z.boolean().optional(),
  roomId: z.string().trim().min(1).optional(),
  subscriptionDate: z.union([z.string(), z.date()]).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  avatarBaseId: z.string().trim().min(1).optional(),
  imageUrl: z.string().trim().min(1).optional(),
  reactivationCount: z.number().int().nonnegative().optional(),
})

export const furnitureCreateSchema = z.object({
  roomId: z.string().trim().min(1),
  imageUrl: z.string().trim().min(1),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  layerIndex: z.number().int().optional(),
})

export const furnitureUpdateSchema = z.object({
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
  width: z.number().positive().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  layerIndex: z.number().int().nullable().optional(),
  isLocked: z.boolean().nullable().optional(),
})

export const avatarBaseCreateSchema = z.object({
  imageUrl: z.string().trim().min(1),
})

export const streamSettingsUpdateSchema = z.object({
  slideDuration: z.number().int().positive().optional(),
  transitionType: z.enum(["none", "fade"]).optional(),
  streamUrl: z.string().trim().min(1).nullable().optional(),
})

export const roomsReorderSchema = z.object({
  roomOrders: z.array(
    z.object({
      id: z.string().trim().min(1),
      orderNumber: z.number().int(),
    })
  ),
})

export const transferMainAdminSchema = z.object({
  userId: z.string().trim().min(1),
})

export const adminRequestCreateSchema = z.object({
  message: z.string().trim().min(1).nullable().optional(),
})

export const adminRequestUpdateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
})
