import { Float, Row } from '../components/decor/primitives'

export default {
  id: 'pascuas',
  name: 'Pascuas',
  emoji: '🐰',
  order: 30,
  preview: ['#fdf8ff', '#ffd6e8', '#7c5cd6'],
  vars: {
    '--c-bg': '#fdf8ff',
    '--c-surface': '#ffffff',
    '--c-surface-2': '#f1e8ff',
    '--c-ink': '#3a2c5c',
    '--c-ink-soft': '#6b5f8a',
    '--c-line': '#e6d9fb',
    '--c-primary': '#7c5cd6',
    '--c-primary-ink': '#ffffff',
    '--c-accent': '#ffd6e8',
    '--c-accent-ink': '#5c1f3f',
    '--c-price': '#b83280',
    '--c-hero-from': '#ffe3f0',
    '--c-hero-to': '#fdf8ff',
    '--c-ticker-bg': '#7c5cd6',
    '--c-ticker-ink': '#ffffff',
  },
  decorations: [
    { component: Float, props: { items: ['🥚', '🌷', '🐣'], count: 9, direction: 'down', size: [18, 28], speed: [14, 22] } },
    { component: Row, props: { items: ['🐰', '🥚', '🐣', '🥚'], count: 7, size: 30, animation: 'hop' } },
  ],
  messages: {
    heroTitle: '¡Feliz Pascua!',
    heroText: 'Huevos de chocolate y mucho dulce para compartir. 🐰',
    banner: 'Pascuas: huevos de chocolate y sorpresas',
    ticker: ['🥚 Huevos de Pascua', '🍫 Chocolates en promo', '🐰 ¡Felices Pascuas!'],
  },
}
