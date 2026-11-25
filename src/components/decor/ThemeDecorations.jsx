import { useTheme } from '../../context/ThemeContext'

/** Monta SOLO las decoraciones que pide el tema activo (si no pide, no se monta nada). */
export default function ThemeDecorations() {
  const { theme } = useTheme()
  if (!theme.decorations?.length) return null
  return (
    <>
      {theme.decorations.map(({ component: C, props }, i) => (
        <C key={`${theme.id}-${i}`} {...props} />
      ))}
    </>
  )
}
