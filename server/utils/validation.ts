import { z } from 'zod'

export const avatarUrlSchema = z
  .string()
  .max(350_000, 'Ukuran foto terlalu besar (maksimal ~250 KB)')
  .refine(
    (val) =>
      val === '' ||
      val.startsWith('https://') ||
      val.startsWith('http://') ||
      /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(val),
    'Format foto tidak valid (gunakan PNG, JPG, atau WebP)'
  )
  .optional()
  .nullable()
