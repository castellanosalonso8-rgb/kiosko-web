/**
 * Lógica de horarios. SIEMPRE en America/Argentina/Buenos_Aires,
 * sin importar la zona horaria del dispositivo.
 *
 * hours:    [{ weekday: 1..7 (1 = lunes), is_open, slots: [{from:'07:00', to:'13:00'}] }]
 * specials: [{ day: 'YYYY-MM-DD', reason, is_closed, slots }]
 */
export const TZ = 'America/Argentina/Buenos_Aires'
export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const WD = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }

/** Fecha y hora actuales vistas desde Buenos Aires. */
export function nowInBA(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  }).formatToParts(date)
  const get = (t) => parts.find((p) => p.type === t)?.value
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: WD[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

const isoWeekday = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return w === 0 ? 7 : w
}

export const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export const toMin = (hhmm = '') => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const hhmm = (min) => {
  const x = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}

/** Franjas como intervalos en minutos. Si "hasta" <= "desde", cruza la medianoche. */
const intervals = (slots = []) =>
  slots
    .filter((s) => s?.from && s?.to)
    .map((s) => {
      const start = toMin(s.from)
      let end = toMin(s.to)
      if (end <= start) end += 1440
      return { start, end }
    })
    .sort((a, b) => a.start - b.start)

/** Qué rige para una fecha: día especial o el horario semanal. */
export function dayInfo(dateStr, hours = [], specials = []) {
  const sp = specials.find((s) => s.day === dateStr)
  if (sp) {
    const slots = sp.is_closed ? [] : sp.slots || []
    return { closed: slots.length === 0, slots, reason: sp.reason, special: true }
  }
  const row = hours.find((h) => h.weekday === isoWeekday(dateStr))
  const slots = row && row.is_open ? row.slots || [] : []
  return { closed: slots.length === 0, slots, special: false }
}

/** { open, label, detail, closesAt, nextOpen } o null si no hay horarios cargados. */
export function computeStatus(hours = [], specials = [], date = new Date()) {
  if (!hours.length && !specials.length) return null
  const { dateStr, minutes: m } = nowInBA(date)
  const today = dayInfo(dateStr, hours, specials)
  const yesterday = dayInfo(addDays(dateStr, -1), hours, specials)

  // ¿Abierto ahora? (incluye franjas de ayer que cruzan la medianoche)
  for (const iv of intervals(today.slots)) {
    if (m >= iv.start && m < iv.end) {
      return { open: true, label: 'Abierto ahora', detail: `Cierra a las ${hhmm(iv.end)}`, closesAt: hhmm(iv.end) }
    }
  }
  for (const iv of intervals(yesterday.slots)) {
    if (iv.end > 1440 && m < iv.end - 1440) {
      return { open: true, label: 'Abierto ahora', detail: `Cierra a las ${hhmm(iv.end)}`, closesAt: hhmm(iv.end) }
    }
  }

  // Cerrado: ¿cuándo abre?
  let when = null
  const later = intervals(today.slots).find((iv) => iv.start > m)
  if (later) when = { text: `hoy a las ${hhmm(later.start)}`, at: hhmm(later.start) }
  for (let n = 1; !when && n <= 7; n++) {
    const d = addDays(dateStr, n)
    const first = intervals(dayInfo(d, hours, specials).slots)[0]
    if (first) {
      const dayName = n === 1 ? 'mañana' : `el ${WEEKDAYS[isoWeekday(d) - 1].toLowerCase()}`
      when = { text: `${dayName} a las ${hhmm(first.start)}`, at: hhmm(first.start) }
    }
  }
  const specialClosed = today.special && today.closed
  const prefix = specialClosed ? `Cerrado hoy${today.reason ? ` (${today.reason})` : ''}` : 'Cerrado'
  return {
    open: false,
    label: when ? `${prefix}, abre ${when.text}` : prefix,
    detail: null,
    nextOpen: when?.at || null,
  }
}

/** "07:00–13:00 y 17:00–23:00" o "Cerrado" */
export const describeSlots = (slots = [], isOpen = true) => {
  const valid = slots.filter((s) => s?.from && s?.to)
  if (!isOpen || !valid.length) return 'Cerrado'
  return valid.map((s) => `${s.from}–${s.to}`).join(' y ')
}

/** Valida las franjas de un día. Devuelve un mensaje o '' si está bien. */
export function validateSlots(slots = []) {
  for (const s of slots) {
    if (!s.from || !s.to) return 'Completá "desde" y "hasta" en todas las franjas'
    if (s.from === s.to) return 'Una franja no puede empezar y terminar a la misma hora'
  }
  const iv = intervals(slots)
  for (let i = 1; i < iv.length; i++) {
    if (iv[i].start < iv[i - 1].end) return 'Las franjas se pisan entre sí'
  }
  return ''
}
