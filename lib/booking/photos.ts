export const BOOKING_PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;

export function validateBookingPhotos(files: { size: number; type: string }[]): string | null {
  if (files.length > 3) return "Ajoutez 3 photos maximum.";
  // Keep the complete multipart request below Vercel's function payload limit.
  if (files.reduce((total, file) => total + file.size, 0) > 3 * 1024 * 1024) return "Les photos doivent faire 3 Mo maximum au total.";
  if (files.some((file) => !Object.hasOwn(BOOKING_PHOTO_TYPES, file.type))) return "Utilisez des photos JPG, PNG ou WebP.";
  return null;
}
