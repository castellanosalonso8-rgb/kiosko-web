import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useNoIndex } from '../../hooks/useNoIndex'
import s from '../../styles/store.module.css'

/** Barra de /demo: cambia el tema EN VIVO sin guardar nada. */
export default function DemoBar({ onConfetti }) {
  const { theme, themes, setPreview } = useTheme()
  useNoIndex()
  return (
    <div className={s.demoBar} role="region" aria-label="Selector de temas de demostración">
      <span className={s.demoLabel}>Demo (no se guarda)</span>
      <div className={s.demoChips}>
        {themes.map((t) => (
          <button
            key={t.id}
            className={`${s.demoChip} ${t.id === theme.id ? s.demoChipOn : ''}`}
            onClick={() => setPreview(t.id)}
            aria-pressed={t.id === theme.id}
          >
            <span aria-hidden="true">{t.emoji}</span> {t.name}
          </button>
        ))}
        <button className={s.demoChip} onClick={onConfetti}>🎉 Confeti</button>
        <Link className={s.demoChip} to="/">Salir</Link>
      </div>
    </div>
  )
}
