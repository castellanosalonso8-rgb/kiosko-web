import { useMemo, useState } from 'react'
import { useRef } from 'react'
import { compressImage } from '../utils/image'
import { normalize } from '../utils/format'
import { useToast } from '../context/ToastContext'
import SlotsEditor from './SlotsEditor'
import s from '../styles/admin.module.css'

const resolve = (x, arg) => (typeof x === 'function' ? x(arg) : x)

/** Subida de foto: preview inmediata, "Cambiar/Quitar". El input abre cámara o galería en el celu. */
function ImageInput({ field, value, pending, onPending }) {
  const toast = useToast()
  const ref = useRef(null)
  const shown = pending?.remove ? '' : pending?.preview || value

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Elegí un archivo de imagen')
    try {
      const blob = await compressImage(file)
      onPending({ blob, preview: URL.createObjectURL(blob) })
      toast.info(`Foto lista (${Math.round(blob.size / 1024)} KB)`)
    } catch (err) {
      toast.error(err.message || 'No se pudo procesar la imagen')
    }
  }

  return (
    <div className={s.dropzone}>
      {shown ? (
        <img className={`${s.imgPreview} ${field.wide ? s.imgWide : ''}`} src={shown} alt="Vista previa" />
      ) : (
        <div className={`${s.imgPreview} ${s.imgPlaceholder} ${field.wide ? s.imgWide : ''}`}>Todavía no hay foto</div>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={pick} hidden />
      <div className={s.rowActions}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => ref.current?.click()}>
          {shown ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {shown && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onPending({ remove: true })}>
            Quitar
          </button>
        )}
      </div>
      <span className="hint">Se achica automáticamente antes de subirse.</span>
    </div>
  )
}

/** Lista de checkboxes con buscador (para elegir productos de una campaña). */
function RelMulti({ options, value, onChange, id }) {
  const [q, setQ] = useState('')
  const list = useMemo(() => options.filter((o) => !q || normalize(o.label).includes(normalize(q))), [options, q])
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div>
      <input id={id} className="input" type="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className={s.checkList} role="group">
        {list.map((o) => (
          <label key={o.value} className={s.checkItem}>
            <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} /> {o.label}
          </label>
        ))}
        {!list.length && <span className="hint">No hay resultados.</span>}
      </div>
      <span className="hint">{value.length} elegidos</span>
    </div>
  )
}

/** Renderiza un campo según su `type`. */
export default function Field({ field: f, values, set, error, ctx, pending, setPending }) {
  const id = `f-${f.name}`
  const v = values[f.name]
  const label = f.label || f.name
  const required = resolve(f.required, values)
  const hint = resolve(f.hint, values)

  if (f.type === 'heading') return <h3 className={s.formHeading}>{label}</h3>

  if (f.type === 'checkbox') {
    return (
      <div className="field">
        <label className={s.toggleRow}>
          <input type="checkbox" checked={Boolean(v)} onChange={(e) => set(f.name, e.target.checked)} />
          <span>
            {label}
            {hint && <span className="hint" style={{ display: 'block', fontWeight: 400 }}>{hint}</span>}
          </span>
        </label>
        {error && <span className="error-text">{error}</span>}
      </div>
    )
  }

  const common = {
    id,
    className: 'input',
    value: v ?? '',
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-err` : undefined,
    onChange: (e) => set(f.name, e.target.value),
  }

  let control
  switch (f.type) {
    case 'textarea':
      control = <textarea {...common} placeholder={f.placeholder} />
      break
    case 'number':
      control = <input {...common} type="number" inputMode={f.integer ? 'numeric' : 'decimal'} step={f.integer ? 1 : 'any'} min={f.min} max={f.max} placeholder={f.placeholder} />
      break
    case 'time':
      control = <input {...common} type="time" />
      break
    case 'date':
      control = <input {...common} type="date" />
      break
    case 'datetime':
      control = <input {...common} type="datetime-local" />
      break
    case 'select': {
      const opts = resolve(f.options, ctx) || []
      control = (
        <select {...common}>
          {!f.noEmpty && <option value="">{f.emptyLabel || 'Elegí…'}</option>}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
      break
    }
    case 'multi': {
      const opts = resolve(f.options, ctx) || []
      control = (
        <div className={s.checkRow} role="group" aria-label={label}>
          {opts.map((o) => (
            <label key={o.value} className={s.checkPill}>
              <input
                type="checkbox"
                checked={(v || []).includes(o.value)}
                onChange={() => set(f.name, (v || []).includes(o.value) ? v.filter((x) => x !== o.value) : [...(v || []), o.value])}
              />
              {o.emoji && <span aria-hidden="true">{o.emoji}</span>} {o.label}
            </label>
          ))}
        </div>
      )
      break
    }
    case 'relmulti':
      control = <RelMulti id={id} options={resolve(f.options, ctx) || []} value={v || []} onChange={(nv) => set(f.name, nv)} />
      break
    case 'slots':
      control = <SlotsEditor value={v || []} onChange={(nv) => set(f.name, nv)} />
      break
    case 'image':
      control = <ImageInput field={f} value={v} pending={pending?.[f.name]} onPending={(p) => setPending(f.name, p)} />
      break
    default:
      control = <input {...common} type="text" inputMode={f.digits ? 'numeric' : f.inputMode} placeholder={f.placeholder} autoComplete="off" />
  }

  return (
    <div className="field">
      {f.type === 'image' || f.type === 'multi' || f.type === 'slots' ? (
        <span className="label">{label}{required ? ' *' : ''}</span>
      ) : (
        <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      )}
      {control}
      {hint && <span className="hint">{hint}</span>}
      {error && <span id={`${id}-err`} className="error-text" role="alert">{error}</span>}
    </div>
  )
}
