import s from '../styles/admin.module.css'

/** Franjas horarias de un día: "07:00 → 13:00", varias por día. Pensado para el celular. */
export default function SlotsEditor({ value, onChange }) {
  const update = (i, patch) => onChange(value.map((sl, j) => (j === i ? { ...sl, ...patch } : sl)))
  const remove = (i) => onChange(value.filter((_, j) => j !== i))
  const add = () => {
    const last = value[value.length - 1]
    onChange([...value, last ? { from: last.to, to: '23:00' } : { from: '08:00', to: '13:00' }])
  }
  return (
    <div className={s.slots}>
      {value.map((sl, i) => (
        <div key={i} className={s.slotRow}>
          <input className="input" type="time" value={sl.from || ''} onChange={(e) => update(i, { from: e.target.value })} aria-label={`Franja ${i + 1}: desde`} />
          <span aria-hidden="true">→</span>
          <input className="input" type="time" value={sl.to || ''} onChange={(e) => update(i, { to: e.target.value })} aria-label={`Franja ${i + 1}: hasta`} />
          <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(i)} aria-label={`Quitar franja ${i + 1}`}>✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={add}>+ Agregar franja</button>
      <span className="hint">Si cerrás después de medianoche (ej. 20:00 → 02:00) también funciona.</span>
    </div>
  )
}
