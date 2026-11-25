import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import s from '../../styles/store.module.css'

const COLORS = ['var(--c-primary)', 'var(--c-accent)', '#ffffff', '#4cc9f0', '#2ec27e', '#ff8fab']

/** Confeti liviano (36 piezas, ~2 s). `fireKey` > 0 dispara una ráfaga nueva. */
export default function Confetti({ fireKey }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!fireKey || reduce) return
    setActive(fireKey)
    const t = setTimeout(() => setActive(0), 2600)
    return () => clearTimeout(t)
  }, [fireKey, reduce])

  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: (Math.random() - 0.5) * 120,
        drift: (Math.random() - 0.5) * 30,
        rot: Math.random() * 720 - 360,
        delay: Math.random() * 0.25,
        size: 6 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active]
  )

  if (!active) return null
  return (
    <div className={s.confetti} aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={`${active}-${i}`}
          className={s.confettiPiece}
          style={{ width: p.size, height: p.size * (p.round ? 1 : 1.6), background: p.color, borderRadius: p.round ? '50%' : 2 }}
          initial={{ x: 0, y: -20, opacity: 1, rotate: 0 }}
          animate={{ x: `${p.x}vw`, y: '105vh', opacity: [1, 1, 0], rotate: p.rot }}
          transition={{ duration: 1.8 + Math.random() * 0.6, delay: p.delay, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  )
}
