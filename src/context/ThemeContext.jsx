import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettings } from './SettingsContext'
import { getTheme, themes } from '../themes'

const ThemeContext = createContext({ theme: getTheme('normal'), themes, preview: null, setPreview: () => {} })

/**
 * Aplica las variables del tema al <html> (+ data-theme).
 * - La web pública usa settings.active_theme (o la vista previa de /demo, sin guardar).
 * - El panel (/admin) SIEMPRE usa el tema normal.
 */
export function ThemeProvider({ children }) {
  const { settings } = useSettings()
  const { pathname } = useLocation()
  const [preview, setPreview] = useState(null)
  const isAdmin = pathname.startsWith('/admin')
  const theme = getTheme(isAdmin ? 'normal' : preview || settings.active_theme)

  useEffect(() => {
    const root = document.documentElement
    const keys = Object.keys(theme.vars || {})
    keys.forEach((k) => root.style.setProperty(k, theme.vars[k]))
    root.dataset.theme = theme.id
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme.vars?.['--c-bg'] || '#fff8ec')
    return () => {
      keys.forEach((k) => root.style.removeProperty(k))
      delete root.dataset.theme
    }
  }, [theme])

  const value = useMemo(() => ({ theme, themes, preview, setPreview }), [theme, preview])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
