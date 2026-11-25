import { Corner, Float, Row } from '../components/decor/primitives'

const cobweb = `<svg viewBox="0 0 100 100" fill="none" stroke="#e9d9ff" stroke-width="1.2" opacity=".75">
<path d="M0 0 L100 0 M0 0 L0 100 M0 0 L100 100 M0 0 L70 100 M0 0 L100 70"/>
<path d="M18 0 Q14 14 0 18 M36 0 Q30 30 0 36 M56 0 Q46 46 0 56 M78 0 Q62 62 0 78"/></svg>`

export default {
  id: 'halloween',
  name: 'Halloween',
  emoji: '🎃',
  order: 10,
  preview: ['#1c1030', '#ff7a1a', '#a66bff'],
  vars: {
    '--c-bg': '#1c1030',
    '--c-surface': '#2a1847',
    '--c-surface-2': '#35205a',
    '--c-ink': '#fdf0e1',
    '--c-ink-soft': '#c9b6e6',
    '--c-line': '#43296d',
    '--c-primary': '#ff7a1a',
    '--c-primary-ink': '#1c1030',
    '--c-accent': '#a66bff',
    '--c-accent-ink': '#1c1030',
    '--c-price': '#ffa24d',
    '--c-hero-from': '#3b1d6b',
    '--c-hero-to': '#1c1030',
    '--c-ticker-bg': '#ff7a1a',
    '--c-ticker-ink': '#1c1030',
    '--shadow-lift': '0 10px 30px rgba(0,0,0,.55)',
  },
  decorations: [
    { component: Corner, props: { corner: 'top-left', svg: cobweb, size: 84 } },
    { component: Corner, props: { corner: 'top-right', svg: cobweb, size: 84 } },
    { component: Float, props: { items: ['🦇', '🦇', '👻'], count: 5, direction: 'across', size: [22, 34], speed: [14, 24] } },
    { component: Row, props: { items: ['🎃', '🕸️', '🎃', '🍬'], count: 6, size: 28, animation: 'wobble' } },
  ],
  messages: {
    heroTitle: '¡Dulce o travesura!',
    heroText: 'Llená la bolsa de golosinas para la noche más terrorífica del año. 🎃',
    banner: 'Especial Halloween: golosinas y más para tu noche de terror',
    ticker: ['🎃 Semana de Halloween', '🍬 Combos de golosinas', '🦇 ¡No te quedes sin dulces!'],
  },
}
