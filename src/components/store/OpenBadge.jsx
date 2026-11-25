import { useHours } from '../../context/HoursContext'
import s from '../../styles/store.module.css'

/** "Abierto ahora" / "Cerrado, abre hoy a las 17:00" (hora de Buenos Aires, en vivo). */
export default function OpenBadge({ compact = false, showDetail = false }) {
  const { status } = useHours()
  if (!status) return null
  return (
    <span
      className={`${s.openBadge} ${status.open ? s.openOn : s.openOff} ${compact ? s.openCompact : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className={s.dot} aria-hidden="true" />
      <span>
        {status.label}
        {showDetail && status.detail ? ` · ${status.detail}` : ''}
      </span>
    </span>
  )
}
