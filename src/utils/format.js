const formatters = {}

/** Formatea plata en la moneda configurada (ARS por defecto, sin decimales). */
export const formatMoney = (n, currency = 'ARS') => {
  if (!formatters[currency]) {
    try {
      formatters[currency] = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      })
    } catch {
      formatters[currency] = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
    }
  }
  return formatters[currency].format(Number(n) || 0)
}

export const slugify = (text) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Para buscar sin acentos ni mayúsculas */
export const normalize = (text = '') =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Deja solo dígitos: formato internacional sin "+" ni espacios */
export const cleanPhone = (value = '') => String(value).replace(/\D/g, '')

export const whatsappUrl = (number, message) => {
  const phone = cleanPhone(number)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export const productMessage = (template, productName) =>
  (template || 'Hola! Quería consultar por *{producto}*. ¿Está disponible?').replace(
    /\{producto\}/gi,
    productName
  )

export const GENERIC_MESSAGE = 'Hola! Quería hacer una consulta'

/** Acepta "@usuario", "usuario" o una URL completa de Instagram */
export const cleanInstagram = (value = '') =>
  value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')

export const instagramUrl = (username) => {
  const user = cleanInstagram(username || '')
  return user ? `https://instagram.com/${user}` : null
}

/* ---------- Mapas (sin API key) ---------- */
const COORDS_RE = /^\s*-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?\s*$/
export const isCoords = (v = '') => COORDS_RE.test(v)
const coordsQuery = (v) => v.replace(/\s+/g, '')

/** El admin puede pegar la URL de embed o el <iframe> completo: nos quedamos con el src. */
export const extractEmbedSrc = (value = '') => {
  const v = value.trim()
  if (!v) return ''
  const m = v.match(/src\s*=\s*["']([^"']+)["']/i)
  return (m ? m[1] : v).replace(/&amp;/g, '&')
}

/** Prioridad: link de embed pegado → coordenadas → dirección. */
export const mapEmbedSrc = (s) => {
  const pasted = extractEmbedSrc(s.map_embed_url || '')
  if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps/i.test(pasted)) return pasted
  if (isCoords(s.map_coords || '')) return `https://www.google.com/maps?q=${coordsQuery(s.map_coords)}&output=embed`
  return s.address ? `https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed` : null
}

/** "Cómo llegar": con coordenadas exactas si las hay, si no con la dirección. */
export const directionsUrl = (s) => {
  const q = isCoords(s.map_coords || '') ? coordsQuery(s.map_coords) : s.address
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
}
