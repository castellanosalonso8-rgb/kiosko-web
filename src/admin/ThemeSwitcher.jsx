import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { humanError } from '../lib/dbErrors'
import { useSettings } from '../context/SettingsContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import s from '../styles/admin.module.css'

/** Selector visual de temática con muestras de color. Cambia active_theme (la web se actualiza sin deploy). */
export default function ThemeSwitcher() {
  const { settings, reload } = useSettings()
  const { themes } = useTheme()
  const toast = useToast()
  const [busy, setBusy] = useState(null)

  const pick = async (t) => {
    setBusy(t.id)
    const { error } = await supabase.from('store_settings').upsert({ id: 1, active_theme: t.id })
    setBusy(null)
    if (error) return toast.error(humanError(error, 'No se pudo cambiar el tema'))
    await reload()
    toast.success(`Tema “${t.name}” activado en la web`)
  }

  return (
    <section className={s.themeBox} aria-labelledby="theme-title">
      <h2 id="theme-title" className={s.h2}>Temática de la web</h2>
      <p className="hint">El panel siempre se ve con el tema normal. Probalos en vivo sin guardar en <Link to="/demo" target="_blank">/demo</Link>.</p>
      <div className={s.themeGrid}>
        {themes.map((t) => {
          const on = t.id === settings.active_theme
          return (
            <button key={t.id} type="button" className={`${s.themeCard} ${on ? s.themeOn : ''}`} onClick={() => !on && pick(t)} disabled={busy !== null} aria-pressed={on}>
              <span className={s.swatches}>
                {t.preview.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <b>{t.emoji} {t.name}</b>
              <span className="hint">{on ? 'Activo ahora' : busy === t.id ? 'Aplicando…' : 'Tocá para activar'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
