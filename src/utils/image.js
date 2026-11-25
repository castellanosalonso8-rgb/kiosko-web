/**
 * Redimensiona y comprime una imagen en el navegador ANTES de subirla.
 * Lado mayor ≤ 1600 px, WebP (fallback JPEG), respeta la orientación EXIF.
 * Rechaza archivos de más de 20 MB.
 */
export const MAX_FILE_MB = 20

export async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`La imagen pesa más de ${MAX_FILE_MB} MB`)
  const bitmap = await loadBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // fondo blanco por si la imagen es PNG transparente
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  if (bitmap.close) bitmap.close()

  const toBlob = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  let blob = await toBlob('image/webp')
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg') // Safari viejo
  if (!blob) throw new Error('No se pudo comprimir la imagen')
  return blob
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* cae al método con <img> (que aplica EXIF solo en navegadores modernos) */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    img.src = url
  })
}
