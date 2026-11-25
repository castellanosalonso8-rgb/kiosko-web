/**
 * formKit: piezas reutilizables para formularios del panel.
 * initialValues(fields, row) · validate(fields, values, check) · toPayload(fields, values)
 *
 * Campos: { name, label, type, required, min, max, minLength, maxLength, integer, digits,
 *           pattern, patternMsg, hint, default, numeric, options, showIf, virtual, ... }
 * Tipos: text, textarea, number, select, checkbox, time, date, datetime, image,
 *        multi (checkboxes con options), relmulti (checkboxes con buscador), slots (franjas horarias),
 *        heading (solo un título de grupo).
 * `required`, `options` y `hint` pueden ser funciones: required(values), options(ctx).
 */
const hasValue = (f) => f.type !== 'heading'

const defaultFor = (f) => {
  if (f.default !== undefined) return typeof f.default === 'function' ? f.default() : f.default
  switch (f.type) {
    case 'checkbox':
      return false
    case 'multi':
    case 'relmulti':
    case 'slots':
      return []
    default:
      return ''
  }
}

const fromRow = (f, v) => {
  if (v === null || v === undefined) return defaultFor(f)
  if (f.type === 'datetime') return String(v).slice(0, 16) // yyyy-MM-ddTHH:mm para <input datetime-local>
  if (f.type === 'time') return String(v).slice(0, 5)
  if (f.type === 'number' || f.type === 'select') return String(v)
  if (f.type === 'checkbox') return Boolean(v)
  return v
}

export function initialValues(fields, row = null) {
  return Object.fromEntries(
    fields.filter(hasValue).map((f) => [f.name, row ? fromRow(f, row[f.name]) : defaultFor(f)])
  )
}

const visible = (f, values) => (f.showIf ? f.showIf(values) : true)
const resolve = (x, values) => (typeof x === 'function' ? x(values) : x)

/** Devuelve { campo: 'mensaje' } (vacío si todo está bien). `files` = fotos nuevas pendientes. */
export function validate(fields, values, check, files = {}) {
  const errors = {}
  for (const f of fields.filter(hasValue)) {
    if (!visible(f, values)) continue
    const v = values[f.name]
    const label = f.label || f.name
    const empty =
      v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0 && f.type !== 'multi' && f.type !== 'relmulti' && f.type !== 'slots')
    const isRequired = resolve(f.required, values)

    if (f.type === 'image') {
      const removed = files[f.name]?.remove
      const has = (v && !removed) || files[f.name]?.blob
      if (isRequired && !has) errors[f.name] = 'Elegí una foto'
      continue
    }
    if (isRequired && (empty || (f.type === 'slots' && !v.length))) {
      errors[f.name] = f.type === 'select' ? 'Elegí una opción' : `${label}: es obligatorio`
      continue
    }
    if (empty || f.type === 'checkbox' || Array.isArray(v)) continue

    if (f.type === 'number') {
      const n = Number(String(v).replace(',', '.'))
      if (!Number.isFinite(n)) errors[f.name] = 'Ingresá un número válido'
      else if (f.integer && !Number.isInteger(n)) errors[f.name] = 'Tiene que ser un número entero'
      else if (f.min !== undefined && n < f.min) errors[f.name] = f.min === 0 ? 'Tiene que ser 0 o más' : `Tiene que ser ${f.min} o más`
      else if (f.max !== undefined && n > f.max) errors[f.name] = `Tiene que ser ${f.max} o menos`
      continue
    }
    const str = String(v)
    if (f.digits && !/^\d+$/.test(str)) errors[f.name] = 'Solo números, sin espacios'
    else if (f.minLength && str.trim().length < f.minLength) errors[f.name] = `Mínimo ${f.minLength} caracteres`
    else if (f.maxLength && str.length > f.maxLength) errors[f.name] = `Máximo ${f.maxLength} caracteres`
    else if (f.pattern && !new RegExp(f.pattern).test(str.trim())) errors[f.name] = f.patternMsg || 'Formato inválido'
  }
  if (check) Object.assign(errors, check(values) || {})
  return errors
}

/** Valores del formulario → objeto listo para insert/update (sin tocar las imágenes). */
export function toPayload(fields, values) {
  const out = {}
  for (const f of fields.filter(hasValue)) {
    if (f.virtual || f.type === 'image' || !visible(f, values)) continue
    const v = values[f.name]
    switch (f.type) {
      case 'number':
        out[f.name] = v === '' || v === null ? (f.zeroIfEmpty ? 0 : null) : Number(String(v).replace(',', '.'))
        break
      case 'select':
        out[f.name] = v === '' ? null : f.numeric ? Number(v) : v
        break
      case 'checkbox':
        out[f.name] = Boolean(v)
        break
      case 'datetime':
        out[f.name] = v ? new Date(v).toISOString() : null
        break
      case 'date':
      case 'time':
        out[f.name] = v || null
        break
      case 'multi':
      case 'relmulti':
        out[f.name] = Array.isArray(v) ? v : []
        break
      case 'slots':
        out[f.name] = (v || []).filter((s) => s.from && s.to)
        break
      default: {
        const t = typeof v === 'string' ? v.trim() : v
        out[f.name] = t === '' ? (f.emptyString ? '' : null) : t
      }
    }
  }
  // Campos ocultos por showIf que deben limpiarse (ej. slots si el día está cerrado)
  for (const f of fields.filter(hasValue)) {
    if (!visible(f, values) && f.clearWhenHidden) out[f.name] = f.type === 'slots' ? [] : null
  }
  return out
}
