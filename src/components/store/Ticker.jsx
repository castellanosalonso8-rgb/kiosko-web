import { useMemo } from 'react'
import s from '../../styles/store.module.css'

/** Marquesina de promos: campañas activas + mensajes del tema + líneas propias del dueño. */
export default function Ticker({ items }) {
  const list = useMemo(() => items.filter(Boolean), [items])
  if (!list.length) return null
  // 8 copias y desplazamiento de 1/8: el loop es continuo aunque haya pocos mensajes
  const track = Array.from({ length: 8 }, () => list).flat()
  return (
    <div className={s.ticker} role="marquee" aria-label="Promociones">
      <div className={s.tickerTrack} style={{ '--n': list.length }}>
        {track.map((t, i) => (
          <span key={i} className={s.tickerItem} aria-hidden={i >= list.length ? 'true' : undefined}>
            {t}
            <span className={s.tickerSep} aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
