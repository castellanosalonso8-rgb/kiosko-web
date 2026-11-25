import { motion } from 'framer-motion'
import { useSettings } from '../../context/SettingsContext'
import { useTheme } from '../../context/ThemeContext'
import { SERVICE_OPTIONS } from '../../config/options'
import OpenBadge from './OpenBadge'
import s from '../../styles/store.module.css'

/** Hero compacto: saludo del tema + "Abierto ahora" + servicios. Que el catálogo quede a un scroll. */
export default function Hero({ banner }) {
  const { settings } = useSettings()
  const { theme } = useTheme()
  const m = theme.messages || {}
  const services = SERVICE_OPTIONS.filter((x) => (settings.services || []).includes(x.value))
  return (
    <section className={s.hero}>
      <motion.div
        className="container"
        key={theme.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span className={s.eyebrow}>
          {settings.store_name}
          {settings.tagline ? ` · ${settings.tagline}` : ''}
        </span>
        <h1 className={s.heroTitle}>{m.heroTitle}</h1>
        <p className={s.heroText}>{m.heroText}</p>
        <div className={s.heroRow}>
          <OpenBadge showDetail />
          {services.map((x) => (
            <span key={x.value} className={s.pill}>
              {x.emoji} {x.label}
            </span>
          ))}
        </div>
        {banner && <p className={s.bannerTag}>{banner}</p>}
      </motion.div>
    </section>
  )
}
