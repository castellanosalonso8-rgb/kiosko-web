import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import d from './decor.module.css'

/** Pseudo-azar determinista (no cambia entre renders). */
const rnd = (i, salt = 1) => {
  const x = Math.sin(i * 9999 + salt * 77) * 10000
  return x - Math.floor(x)
}

/**
 * Partículas que caen / suben / cruzan la pantalla.
 * props: items:[emoji], count, direction:'down'|'up'|'across', size:[min,max], speed:[min,max] (seg)
 */
export function Float({ items = ['✨'], count = 10, direction = 'down', size = [16, 28], speed = [10, 18] }) {
  const reduce = useReducedMotion()
  const list = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        emoji: items[i % items.length],
        x: direction === 'across' ? 0 : `${Math.round(rnd(i, 1) * 96)}%`,
        top: direction === 'across' ? `${Math.round(8 + rnd(i, 2) * 55)}%` : 0,
        size: Math.round(size[0] + rnd(i, 3) * (size[1] - size[0])),
        dur: (speed[0] + rnd(i, 4) * (speed[1] - speed[0])).toFixed(1),
        delay: (-rnd(i, 5) * speed[1]).toFixed(1),
        sway: `${Math.round((rnd(i, 6) - 0.5) * 80)}px`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, direction, items.join('|')]
  )
  if (reduce) return null
  const anim = { down: 'fall', up: 'rise', across: 'across' }[direction] || 'fall'
  return (
    <div className={d.layer} aria-hidden="true">
      {list.map((p, i) => (
        <span
          key={i}
          className={d.particle}
          style={{
            '--x': p.x,
            '--size': `${p.size}px`,
            '--dur': `${p.dur}s`,
            '--delay': `${p.delay}s`,
            '--sway': direction === 'across' ? `${Math.round((rnd(i, 7) - 0.5) * 120)}px` : p.sway,
            '--anim': anim,
            top: p.top,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

/** Un adorno fijo en una esquina (emoji o SVG propio). corner: 'top-left' | 'top-right' | … */
export function Corner({ corner = 'top-left', emoji, svg, size = 90, sway = false, offset = [0, 0] }) {
  const reduce = useReducedMotion()
  const [v, h] = corner.split('-')
  const style = { width: size, fontSize: size * 0.8, [v]: offset[1], [h]: offset[0] }
  return (
    <div className={`${d.corner} ${sway && !reduce ? d.sway : ''}`} style={style} aria-hidden="true">
      {svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : emoji}
    </div>
  )
}

/** Guirnalda de luces parpadeantes arriba de todo. */
export function Garland({ colors = ['#ff3b3b', '#ffd23b', '#3bff7a', '#3b9bff'], count = 22 }) {
  const reduce = useReducedMotion()
  return (
    <div className={d.garland} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={d.bulb}
          style={{ '--bulb': colors[i % colors.length], '--delay': `${(i % 5) * 0.3}s`, animation: reduce ? 'none' : undefined }}
        />
      ))}
    </div>
  )
}

/** Fila de adornos al pie que saltan o se mecen. animation: 'hop' | 'wobble' */
export function Row({ items = ['🎃'], count = 7, size = 30, animation = 'hop' }) {
  const reduce = useReducedMotion()
  return (
    <div className={d.row} style={{ '--size': `${size}px` }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ '--delay': `${(i * 0.23).toFixed(2)}s`, '--anim': animation, animation: reduce ? 'none' : undefined }}>
          {items[i % items.length]}
        </span>
      ))}
    </div>
  )
}
