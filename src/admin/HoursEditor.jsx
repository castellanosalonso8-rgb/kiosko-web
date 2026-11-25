import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { humanError } from '../lib/dbErrors'
import { useToast } from '../context/ToastContext'
import { useHours } from '../context/HoursContext'
import { WEEKDAYS, validateSlots } from '../lib/hours'
import SlotsEditor from './SlotsEditor'
import s from '../styles/admin.module.css'

const BASE = WEEKDAYS.map((_, i) => ({ weekday: i + 1, is_open: i < 6, slots: i < 6 ? [{ from: '08:00', to: '22:00' }] : [] }))

/** Editor simple por día (abierto/cerrado + una o más franjas), usable desde el celular. */
export default function HoursEditor() {
  const toast = useToast()
  const { reload } = useHours()
  const [rows, setRows] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState(false)

  const load = async () => {
    setFail(false)
    const { data, error } = await supabase.from('business_hours').select('*').order('weekday')
    if (error) return setFail(true)
    setRows(BASE.map((b) => data.find((d) => d.weekday === b.weekday) || b))
  }
  useEffect(() => {
    load()
  }, [])

  const patch = (i, p) => {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)))
    setErrors((e) => ({ ...e, [i]: undefined }))
  }
  const copyToAll = (i) => {
    setRows((r) => r.map((x) => ({ ...x, is_open: r[i].is_open, slots: r[i].slots.map((sl) => ({ ...sl })) })))
    toast.info('Copiado a todos los días (falta guardar)')
  }

  const save = async () => {
    const errs = {}
    rows.forEach((r, i) => {
      if (!r.is_open) return
      if (!r.slots.length) errs[i] = 'Agregá al menos una franja o marcalo como cerrado'
      else errs[i] = validateSlots(r.slots) || undefined
    })
    const clean = Object.fromEntries(Object.entries(errs).filter(([, v]) => v))
    setErrors(clean)
    if (Object.keys(clean).length) return toast.error('Revisá los días marcados')
    setBusy(true)
    const { error } = await supabase.from('business_hours').upsert(
      rows.map((r) => ({ weekday: r.weekday, is_open: r.is_open, slots: r.is_open ? r.slots : [] }))
    )
    setBusy(false)
    if (error) return toast.error(humanError(error, 'No se pudieron guardar los horarios'))
    reload()
    toast.success('Horarios guardados')
  }

  if (fail) return <div className={s.emptyState} role="alert"><p>No pudimos cargar los horarios.</p><button className="btn btn-primary" onClick={load}>Reintentar</button></div>
  if (!rows) return <ul className={s.list} aria-busy="true">{[0, 1, 2].map((i) => <li key={i} className={`${s.row} ${s.skel}`} />)}</ul>

  return (
    <div>
      <h1 className={s.h1}>Horarios</h1>
      <p className="hint" style={{ marginBottom: '0.9rem' }}>Hora de Buenos Aires. Cada día puede tener varias franjas (ej. 07:00–13:00 y 17:00–23:00).</p>
      <ul className={s.list}>
        {rows.map((r, i) => (
          <li key={r.weekday} className={`${s.card} ${s.dayCard}`}>
            <div className={s.dayHead}>
              <b>{WEEKDAYS[i]}</b>
              <label className={s.switch}>
                <input type="checkbox" checked={r.is_open} onChange={(e) => patch(i, { is_open: e.target.checked, slots: e.target.checked && !r.slots.length ? [{ from: '08:00', to: '22:00' }] : r.slots })} />
                <span>{r.is_open ? 'Abierto' : 'Cerrado'}</span>
              </label>
            </div>
            {r.is_open && <SlotsEditor value={r.slots} onChange={(v) => patch(i, { slots: v })} />}
            {errors[i] && <span className="error-text" role="alert">{errors[i]}</span>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyToAll(i)} style={{ alignSelf: 'flex-start' }}>Copiar a todos los días</button>
          </li>
        ))}
      </ul>
      <div className={s.stickySave}>
        <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar horarios'}</button>
      </div>
    </div>
  )
}
