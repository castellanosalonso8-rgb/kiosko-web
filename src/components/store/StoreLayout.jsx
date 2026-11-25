import { useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useCatalog } from '../../hooks/useCatalog'
import { useSettings } from '../../context/SettingsContext'
import { useTheme } from '../../context/ThemeContext'
import { CartProvider } from '../../context/CartContext'
import { session } from '../../utils/safeStorage'
import Notice from './Notice'
import Ticker from './Ticker'
import Header from './Header'
import Footer from './Footer'
import WhatsAppFab from './WhatsAppFab'
import CartBar from './CartBar'
import CartDrawer from './CartDrawer'
import Confetti from './Confetti'
import DemoBar from './DemoBar'
import ThemeDecorations from '../decor/ThemeDecorations'
import s from '../../styles/store.module.css'

/** Layout de la tienda pública. Carga el catálogo una vez y lo comparte con las páginas. */
export default function StoreLayout({ demo = false }) {
  const catalog = useCatalog()
  const { settings } = useSettings()
  const { theme, setPreview } = useTheme()
  const [confettiKey, setConfettiKey] = useState(0)

  // Al salir de /demo volvemos al tema real
  useEffect(() => () => demo && setPreview(null), [demo, setPreview])

  // Solo mostramos categorías que tienen al menos un producto activo
  const categories = useMemo(() => {
    const used = new Set(catalog.products.map((p) => p.category_id))
    return catalog.categories.filter((c) => used.has(c.id))
  }, [catalog.products, catalog.categories])

  // Confeti una vez por sesión al entrar con una campaña activa
  const campaign = catalog.campaigns[0]
  useEffect(() => {
    if (!campaign) return
    const k = `confetti:${campaign.id}`
    if (session.get(k)) return
    session.set(k, '1')
    setConfettiKey((n) => n + 1)
  }, [campaign])

  const tickerItems = useMemo(
    () => [
      ...catalog.campaigns.map((c) => c.banner_message || `${c.name}${c.discount_percent ? ` · -${c.discount_percent}%` : ''}`),
      ...(theme.messages?.ticker || []),
      ...(settings.promo_ticker || '').split('\n').map((x) => x.trim()),
    ],
    [catalog.campaigns, theme, settings.promo_ticker]
  )

  return (
    <CartProvider products={catalog.products}>
      <div className={s.shell} style={demo ? { '--bottom-gap': '76px' } : undefined}>
        <Notice />
        <Ticker items={tickerItems} />
        <Header />
        <main>
          <Outlet context={{ ...catalog, categories, campaign }} />
        </main>
        <Footer />
        <CartBar />
        <CartDrawer />
        <WhatsAppFab />
        <ThemeDecorations />
        <Confetti fireKey={confettiKey} />
        {demo && <DemoBar onConfetti={() => setConfettiKey((n) => n + 1)} />}
      </div>
    </CartProvider>
  )
}
