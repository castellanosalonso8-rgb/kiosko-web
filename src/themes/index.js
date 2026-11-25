/**
 * Registro de temas. Cada tema es UN archivo en esta carpeta; se detectan solos.
 * Sumar uno nuevo = copiar normal.js, cambiar id/vars/decorations/messages. Sin tocar nada más.
 */
const modules = import.meta.glob(['./*.js', '!./index.js'], { eager: true })

export const themes = Object.values(modules)
  .map((m) => m.default)
  .filter((t) => t && t.id)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

export const DEFAULT_THEME_ID = 'normal'

export const getTheme = (id) =>
  themes.find((t) => t.id === id) || themes.find((t) => t.id === DEFAULT_THEME_ID) || themes[0]
