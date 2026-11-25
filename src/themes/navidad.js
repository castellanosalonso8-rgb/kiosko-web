import { Corner, Float, Garland } from '../components/decor/primitives'

export default {
  id: 'navidad',
  name: 'Navidad',
  emoji: '🎄',
  order: 20,
  preview: ['#f7fbf4', '#c8102e', '#1f6b3f'],
  vars: {
    '--c-bg': '#f7fbf4',
    '--c-surface': '#ffffff',
    '--c-surface-2': '#e4f3e1',
    '--c-ink': '#16301f',
    '--c-ink-soft': '#4b6a55',
    '--c-line': '#cfe5cf',
    '--c-primary': '#c8102e',
    '--c-primary-ink': '#ffffff',
    '--c-accent': '#f4c542',
    '--c-accent-ink': '#3a2a00',
    '--c-price': '#c8102e',
    '--c-hero-from': '#cfeccb',
    '--c-hero-to': '#f7fbf4',
    '--c-ticker-bg': '#1f6b3f',
    '--c-ticker-ink': '#ffffff',
  },
  decorations: [
    { component: Garland, props: { colors: ['#ff3b3b', '#ffd23b', '#3bd16f', '#ffffff'] } },
    { component: Float, props: { items: ['❄️', '❅', '❆'], count: 16, direction: 'down', size: [12, 24], speed: [10, 20] } },
    { component: Corner, props: { corner: 'top-right', emoji: '🎅', size: 64, sway: true, offset: [8, 64] } },
  ],
  messages: {
    heroTitle: '¡Felices Fiestas!',
    heroText: 'Brindis, dulces y mesa dulce: todo para armar tu Navidad. 🎄',
    banner: 'Navidad: armá tu pedido para las fiestas',
    ticker: ['🎄 Combos navideños', '🍫 Chocolates para regalar', '🥤 Bebidas para el brindis'],
  },
}
