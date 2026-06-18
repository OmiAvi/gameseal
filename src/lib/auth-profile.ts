import { z } from 'zod'

export const usernamePattern = /^[a-zA-Z0-9_.]+$/

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(
      usernamePattern,
      'Username can only include letters, numbers, dots, and underscores',
    ),
  bio: z.string().trim().max(160).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
