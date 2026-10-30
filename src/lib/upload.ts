import imageCompression from 'browser-image-compression'

export const ACCEPTED_DOCUMENT_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'application/pdf': ['.pdf'],
}

/** Matches the backend's OCR upload limit (src/common/config/upload.config.ts). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

// Serverless deployments (Vercel) reject request bodies above ~4.5MB, well under the backend's
// own 10MB limit, so photos are shrunk client-side before upload. OCR is still reliable at this size.
const IMAGE_TARGET_MB = 3

/** Builds the multipart body for an OCR endpoint, compressing large photos first. */
export async function buildOcrFormData(file: File): Promise<FormData> {
  let upload: File | Blob = file
  if (file.type.startsWith('image/') && file.type !== 'image/heic' && file.size > IMAGE_TARGET_MB * 1024 * 1024) {
    upload = await imageCompression(file, { maxSizeMB: IMAGE_TARGET_MB, maxWidthOrHeight: 3000, useWebWorker: true })
  }
  const formData = new FormData()
  formData.append('file', upload, file.name)
  return formData
}
