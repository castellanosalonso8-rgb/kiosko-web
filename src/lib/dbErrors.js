/** Traduce errores de Postgres/Supabase a lenguaje humano. */
export function humanError(err, fallback = 'No se pudo guardar. Probá de nuevo.') {
  if (!err) return fallback
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'No hay conexión. Revisá internet y probá de nuevo.'
  const msg = String(err.message || '')
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return 'No hay conexión. Revisá internet y probá de nuevo.'
  switch (err.code) {
    case '23505':
      return 'Ya existe un registro con ese valor (nombre, código o fecha repetidos).'
    case '23514':
      if (/notice_text_required/.test(msg)) return 'Si el aviso está activado, el texto es obligatorio.'
      return 'Hay un valor fuera de rango. Revisá los campos.'
    case '23502':
      return 'Falta completar un campo obligatorio.'
    case '23503':
      return 'No se puede por una relación con otro dato (está en uso).'
    case '42501':
      return 'No tenés permisos. Volvé a entrar al panel.'
    case 'PGRST301':
    case '401':
      return 'Tu sesión venció. Volvé a entrar.'
    default:
      return fallback
  }
}
