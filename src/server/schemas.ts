import { z } from 'zod'

export const vaultParamsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[a-z0-9_]+$/i, 'Usernames can only include letters, numbers, and underscores'),
})

export type VaultParams = z.infer<typeof vaultParamsSchema>

export const momentParamsSchema = z.object({
  momentId: z.string().trim().min(8).max(64),
})

export type MomentParams = z.infer<typeof momentParamsSchema>

export const collectionParamsSchema = z.object({
  collectionId: z.string().trim().min(8).max(64),
})

export type CollectionParams = z.infer<typeof collectionParamsSchema>
