import { PAYMENT_OPTIONS, SERVICE_OPTIONS } from '../../config/options'
import { useSettings } from '../../context/SettingsContext'
import s from '../../styles/store.module.css'

/** Medios de pago aceptados, como íconos. */
export function PaymentMethods() {
  const { settings } = useSettings()
  const list = PAYMENT_OPTIONS.filter((p) => (settings.payment_methods || []).includes(p.value))
  if (!list.length) return null
  return (
    <ul className={s.chipList} aria-label="Medios de pago">
      {list.map((p) => (
        <li key={p.value} className={s.pill}>
          <span aria-hidden="true">{p.emoji}</span> {p.label}
        </li>
      ))}
    </ul>
  )
}

/** Servicios del kiosko: SUBE, recargas, fotocopias. */
export function Services() {
  const { settings } = useSettings()
  const list = SERVICE_OPTIONS.filter((p) => (settings.services || []).includes(p.value))
  if (!list.length) return null
  return (
    <ul className={s.chipList} aria-label="Servicios">
      {list.map((p) => (
        <li key={p.value} className={s.pill}>
          <span aria-hidden="true">{p.emoji}</span> {p.label}
        </li>
      ))}
    </ul>
  )
}
