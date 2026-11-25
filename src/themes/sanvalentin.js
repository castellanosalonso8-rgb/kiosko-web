import { Float } from '../components/decor/primitives'

export default {
  id: 'sanvalentin',
  name: 'San Valentín',
  emoji: '💘',
  order: 40,
  preview: ['#fff1f4', '#d6204f', '#ffb3c7'],
  vars: {
    '--c-bg': '#fff1f4',
    '--c-surface': '#ffffff',
    '--c-surface-2': '#ffdfe7',
    '--c-ink': '#4a1230',
    '--c-ink-soft': '#7d4a63',
    '--c-line': '#f6c9d6',
    '--c-primary': '#d6204f',
    '--c-primary-ink': '#ffffff',
    '--c-accent': '#ffb3c7',
    '--c-accent-ink': '#4a1230',
    '--c-price': '#c2183f',
    '--c-hero-from': '#ffd0dc',
    '--c-hero-to': '#fff1f4',
    '--c-ticker-bg': '#d6204f',
    '--c-ticker-ink': '#ffffff',
  },
  decorations: [
    { component: Float, props: { items: ['❤️', '💕', '💖', '🌹'], count: 14, direction: 'up', size: [14, 30], speed: [9, 17] } },
  ],
  messages: {
    heroTitle: 'Dulces para quien más querés',
    heroText: 'Chocolates, golosinas y regalitos para San Valentín. 💘',
    banner: 'San Valentín: chocolates para regalar',
    ticker: ['💘 Día de los enamorados', '🍫 Chocolates en oferta', '🌹 Armá tu regalo'],
  },
}
