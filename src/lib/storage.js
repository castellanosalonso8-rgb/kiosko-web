import { supabase, BUCKET } from './supabaseClient'

/** Saca la ruta del archivo dentro del bucket a partir de la URL pública. */
export const storagePathFromUrl = (url) => {
  if (!url) return null
  const marker = `/${BUCKET}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0])
}

/** Sube un Blob y devuelve { path, url }. */
export async function uploadImage(blob, folder) {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error
  return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }
}

/** Borra por URL pública o por ruta. Best-effort: NUNCA rompe el flujo. */
export async function removeImages(urlsOrPaths) {
  const paths = urlsOrPaths
    .filter(Boolean)
    .map((v) => (v.startsWith('http') ? storagePathFromUrl(v) : v))
    .filter(Boolean)
  if (!paths.length) return
  try {
    await supabase.storage.from(BUCKET).remove(paths)
  } catch (e) {
    console.warn('No se pudo borrar del Storage', e)
  }
}
