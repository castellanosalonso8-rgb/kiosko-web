import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { uploadImage, removeImages } from '../lib/storage'
import { humanError } from '../lib/dbErrors'
import { useToast } from '../context/ToastContext'
import { useUI } from '../context/UIContext'
import { useMoney, useSettings } from '../context/SettingsContext'
import { normalize } from '../utils/format'
import { initialValues, toPayload, validate } from './formKit'
import Field from './Field'
import s from '../styles/admin.module.css'

/** Evento global: lo escucha el panel para tirar confeti al activar una campaña. */
export const fireConfetti = () => window.dispatchEvent(new Event('kiosko:confetti'))

/**
 * CrudPage: lista en tarjetas + formulario en bottom sheet para cualquier recurso declarado
 * por configuración (ver resources.jsx). Resuelve solo: skeleton, vacío, error con reintento,
 * buscador (>6 filas), ojito de visibilidad con update optimista, borrado con confirmación,
 * fotos (subir → guardar → borrar la vieja; si falla, se borran las recién subidas) y toasts.
 */
export default function CrudPage({ resource: r }) {
  const toast = useToast()
  const { confirm } = useUI()
  const money = useMoney()
  const { reload: reloadSettings } = useSettings()

  const [rows, setRows] = useState([])
  const [extra, setExtra] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // { row: obj|null }

  const key = r.key || 'id'
  const ctx = useMemo(() => ({ ...extra, money }), [extra, money])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      let q = supabase.from(r.table).select(r.select || '*')
      for (const [k, v] of Object.entries(r.filter || {})) q = q.eq(k, v)
      for (const [col, asc] of r.order || [['created_at', false]]) q = q.order(col, { ascending: asc })
      const [list, ex] = await Promise.all([q, r.loadExtra ? r.loadExtra(supabase) : {}])
      if (list.error) throw list.error
      setRows(list.data)
      setExtra(ex || {})
    } catch (e) {
      console.error(e)
      setError(true)
    }
    setLoading(false)
  }, [r])

  useEffect(() => {
    load()
  }, [load])

  const activeOn = (row) => (r.activeInverted ? !row[r.activeField] : row[r.activeField])

  const toggleActive = async (row) => {
    const next = !row[r.activeField]
    setRows((l) => l.map((x) => (x[key] === row[key] ? { ...x, [r.activeField]: next } : x))) // optimista
    const { error: err } = await supabase.from(r.table).update({ [r.activeField]: next }).eq(key, row[key])
    if (err) {
      setRows((l) => l.map((x) => (x[key] === row[key] ? { ...x, [r.activeField]: !next } : x)))
      return toast.error(humanError(err, 'No se pudo cambiar el estado'))
    }
    const on = r.activeInverted ? !next : next
    toast.success(on ? r.onLabel || 'Ahora se ve en la web' : r.offLabel || 'Oculto de la web')
    if (on && r.confettiOnActivate) fireConfetti()
    if (r.table === 'campaigns') load() // el precio final puede cambiar
  }

  const imageFields = (r.fields || []).filter((f) => f.type === 'image')

  const remove = async (row) => {
    const name = r.card(row, ctx).title
    const ok = await confirm({
      title: `¿Eliminar ${r.fem ? 'esta' : 'este'} ${r.singular}?`,
      message: r.deleteMessage ? r.deleteMessage(row) : `Vas a borrar “${name}” de forma permanente.`,
    })
    if (!ok) return
    const { error: err } = await supabase.from(r.table).delete().eq(key, row[key])
    if (err) return toast.error(humanError(err, 'No se pudo eliminar'))
    await removeImages(imageFields.map((f) => row[f.name]))
    setRows((l) => l.filter((x) => x[key] !== row[key]))
    toast.success(`${r.singular[0].toUpperCase()}${r.singular.slice(1)} ${r.fem ? 'eliminada' : 'eliminado'}`)
  }

  const runAction = async (a, row) => {
    try {
      await a.run(row, { supabase, toast, reload: load, ctx, reloadSettings })
    } catch (e) {
      toast.error(humanError(e, 'No se pudo completar la acción'))
    }
  }

  const shown = useMemo(() => {
    const q = normalize(query.trim())
    if (!q || !r.search) return rows
    return rows.filter((row) => normalize(r.search.map((k) => row[k] ?? '').join(' ')).includes(q))
  }, [rows, query, r.search])

  const Header = r.header
  return (
    <div>
      {Header && <Header ctx={ctx} reload={load} />}
      <div className={s.listHead}>
        <h1 className={s.h1}>
          {rows.length} {rows.length === 1 ? r.singular : r.title.toLowerCase()}
        </h1>
        <button className="btn btn-primary" onClick={() => setEditing({ row: null })}>
          + {r.fem ? 'Nueva' : 'Nuevo'} {r.singular}
        </button>
      </div>
      {r.intro && <p className="hint" style={{ marginBottom: '0.9rem' }}>{r.intro}</p>}

      {rows.length > 6 && r.search && (
        <input className="input" type="search" placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: '0.9rem' }} aria-label="Buscar" />
      )}

      {loading && (
        <ul className={s.list} aria-busy="true">
          {[0, 1, 2].map((i) => <li key={i} className={`${s.row} ${s.skel}`} />)}
        </ul>
      )}

      {error && !loading && (
        <div className={s.emptyState} role="alert">
          <p>No pudimos cargar la lista.</p>
          <button className="btn btn-primary" onClick={load}>Reintentar</button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className={s.emptyState}>
          <p>{r.emptyText || `Todavía no cargaste nada. ¡Tocá “${r.fem ? 'Nueva' : 'Nuevo'} ${r.singular}”!`}</p>
        </div>
      )}

      {!loading && !error && (
        <ul className={s.list}>
          <AnimatePresence initial={false}>
            {shown.map((row) => {
              const c = r.card(row, ctx)
              const off = r.activeField && !activeOn(row)
              return (
                <motion.li key={row[key]} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className={`${s.row} ${off ? s.inactive : ''}`}>
                  {c.image !== undefined && (
                    c.image ? <img className={s.thumb} src={c.image} alt="" loading="lazy" /> : <div className={`${s.thumb} ${s.thumbEmpty}`} aria-hidden="true">{c.initial || String(c.title || '?').charAt(0)}</div>
                  )}
                  <div className={s.rowInfo}>
                    <span className={s.rowName}>{c.title}</span>
                    {c.sub && <span className={s.rowMeta}>{c.sub}</span>}
                    {c.badges?.length > 0 && (
                      <div className={s.chips}>
                        {c.badges.map((b, i) => {
                          const o = typeof b === 'string' ? { text: b } : b
                          return <span key={i} className={`${s.chip} ${o.tone === 'off' ? s.chipOff : ''} ${o.tone === 'warn' ? s.chipWarn : ''} ${o.tone === 'ok' ? s.chipOk : ''}`}>{o.text}</span>
                        })}
                      </div>
                    )}
                    {c.warn && <span className="error-text">{c.warn}</span>}
                    <div className={s.rowActions}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ row })}>Editar</button>
                      {r.activeField && (
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(row)} aria-pressed={!off}>
                          {off ? `👁 ${r.showLabel || 'Mostrar'}` : `🚫 ${r.hideLabel || 'Ocultar'}`}
                        </button>
                      )}
                      {(r.actions || []).filter((a) => !a.when || a.when(row)).map((a, i) => (
                        <button key={i} className="btn btn-accent btn-sm" onClick={() => runAction(a, row)}>
                          {typeof a.label === 'function' ? a.label(row) : a.label}
                        </button>
                      ))}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(row)}>Eliminar</button>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {editing && (
          <FormSheet
            key={editing.row ? editing.row[key] : 'new'}
            resource={r}
            row={editing.row}
            ctx={ctx}
            onClose={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null)
              await load()
              if (r.table === 'campaigns') reloadSettings()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- Formulario en bottom sheet ---------------- */
function FormSheet({ resource: r, row, ctx, onClose, onSaved }) {
  const toast = useToast()
  const key = r.key || 'id'
  const isEdit = Boolean(row)

  const fields = useMemo(() => {
    const f = [...r.fields]
    if (r.activeField && !f.some((x) => x.name === r.activeField)) {
      f.push({ name: r.activeField, type: 'checkbox', label: r.activeLabel || 'Visible en la web', default: true })
    }
    return f
  }, [r])

  const [values, setValues] = useState(() => ({ ...initialValues(fields, row), ...(!row ? r.defaults || {} : {}) }))
  const [errors, setErrors] = useState({})
  const [pending, setPendingMap] = useState({}) // fotos nuevas / quitadas
  const [busy, setBusy] = useState(false)

  const set = (name, v) => {
    setValues((x) => ({ ...x, [name]: v }))
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e))
  }
  const setPending = (name, p) => {
    setPendingMap((m) => ({ ...m, [name]: p }))
    setErrors((e) => ({ ...e, [name]: undefined }))
  }

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, busy])

  const submit = async (ev) => {
    ev.preventDefault()
    const errs = validate(fields, values, r.check, pending)
    const clean = Object.fromEntries(Object.entries(errs).filter(([, v]) => v))
    setErrors(clean)
    if (Object.keys(clean).length) return toast.error('Revisá los campos marcados')

    setBusy(true)
    const uploaded = []
    try {
      let payload = { ...toPayload(fields, values), ...(r.forced || {}) }
      const toDelete = []

      // 1) fotos: subir las nuevas primero
      for (const f of fields.filter((x) => x.type === 'image')) {
        const p = pending[f.name]
        const old = row?.[f.name] || null
        if (p?.blob) {
          const up = await uploadImage(p.blob, f.folder || 'misc')
          uploaded.push(up.path)
          payload[f.name] = up.url
          if (old) toDelete.push(old)
        } else if (p?.remove) {
          payload[f.name] = null
          if (old) toDelete.push(old)
        }
      }

      if (r.beforeSave) payload = await r.beforeSave(payload, values, { row, ctx })

      // 2) guardar en la base
      const { error } = isEdit
        ? await supabase.from(r.table).update(payload).eq(key, row[key])
        : await supabase.from(r.table).insert(payload)
      if (error) throw error

      // 3) recién ahora borrar la foto vieja (nunca rompe el flujo)
      await removeImages(toDelete)

      toast.success(isEdit ? 'Cambios guardados' : `${r.singular[0].toUpperCase()}${r.singular.slice(1)} ${r.fem ? 'creada' : 'creado'}`)
      await onSaved()
    } catch (err) {
      console.error(err)
      await removeImages(uploaded) // cero fotos huérfanas si falló el guardado
      toast.error(humanError(err))
      setBusy(false)
    }
  }

  return (
    <motion.div className={s.sheetBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form
        className={s.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? `Editar ${r.singular}` : `${r.fem ? 'Nueva' : 'Nuevo'} ${r.singular}`}
        onSubmit={submit}
        noValidate
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      >
        <header className={s.sheetHead}>
          <h2>{isEdit ? `Editar ${r.singular}` : `${r.fem ? 'Nueva' : 'Nuevo'} ${r.singular}`}</h2>
          <button type="button" className={s.sheetClose} onClick={onClose} disabled={busy} aria-label="Cerrar">✕</button>
        </header>
        <div className={s.sheetBody}>
          {fields.filter((f) => !f.showIf || f.showIf(values)).map((f) => (
            <Field key={f.name} field={f} values={values} set={set} error={errors[f.name]} ctx={ctx} pending={pending} setPending={setPending} />
          ))}
        </div>
        <footer className={s.sheetFoot}>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : `Crear ${r.singular}`}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
        </footer>
      </motion.form>
    </motion.div>
  )
}
