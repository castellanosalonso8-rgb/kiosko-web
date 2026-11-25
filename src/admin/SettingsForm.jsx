import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { uploadImage, removeImages } from '../lib/storage'
import { humanError } from '../lib/dbErrors'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import { initialValues, toPayload, validate } from './formKit'
import Field from './Field'
import s from '../styles/admin.module.css'

/**
 * Formulario de la fila única store_settings. Cada sección declara SOLO sus campos:
 * se guardan únicamente esos (upsert id = 1). Botón "Guardar" pegajoso abajo.
 */
export default function SettingsForm({ title, intro, fields, check, transform }) {
  const { settings, reload } = useSettings()
  const toast = useToast()
  const ctx = useMemo(() => ({ settings }), [settings])
  const [values, setValues] = useState(() => initialValues(fields, settings))
  const [errors, setErrors] = useState({})
  const [pending, setPendingMap] = useState({})
  const [busy, setBusy] = useState(false)

  // Cuando llegan los datos de la base (o se guardan), refrescamos el formulario
  useEffect(() => {
    setValues(initialValues(fields, settings))
    setPendingMap({})
  }, [settings, fields])

  const set = (name, v) => {
    setValues((x) => ({ ...x, [name]: v }))
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e))
  }
  const setPending = (name, p) => setPendingMap((m) => ({ ...m, [name]: p }))

  const submit = async (ev) => {
    ev.preventDefault()
    const errs = validate(fields, values, check, pending)
    const clean = Object.fromEntries(Object.entries(errs).filter(([, v]) => v))
    setErrors(clean)
    if (Object.keys(clean).length) return toast.error('Revisá los campos marcados')

    setBusy(true)
    const uploaded = []
    try {
      let payload = toPayload(fields, values)
      if (transform) payload = transform(payload)
      const toDelete = []
      for (const f of fields.filter((x) => x.type === 'image')) {
        const p = pending[f.name]
        const old = settings[f.name] || null
        if (p?.blob) {
          const up = await uploadImage(p.blob, f.folder || 'branding')
          uploaded.push(up.path)
          payload[f.name] = up.url
          if (old) toDelete.push(old)
        } else if (p?.remove) {
          payload[f.name] = null
          if (old) toDelete.push(old)
        }
      }
      // Los campos de texto vacíos en columnas NOT NULL con default se guardan como ''
      const { error } = await supabase.from('store_settings').upsert({ id: 1, ...payload })
      if (error) throw error
      await removeImages(toDelete)
      await reload()
      toast.success('Guardado. La web ya se actualizó.')
    } catch (err) {
      console.error(err)
      await removeImages(uploaded)
      toast.error(humanError(err, 'No se pudieron guardar los datos'))
    }
    setBusy(false)
  }

  return (
    <form className={s.settingsForm} onSubmit={submit} noValidate>
      <h1 className={s.h1}>{title}</h1>
      {intro && <p className="hint">{intro}</p>}
      <div className={s.card}>
        {fields.filter((f) => !f.showIf || f.showIf(values)).map((f) => (
          <Field key={f.name} field={f} values={values} set={set} error={errors[f.name]} ctx={ctx} pending={pending} setPending={setPending} />
        ))}
      </div>
      <div className={s.stickySave}>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  )
}
