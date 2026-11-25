import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'
import { useCart } from '../../context/CartContext'
import { instagramUrl } from '../../utils/format'
import OpenBadge from './OpenBadge'
import { CartIcon, InstagramIcon } from './Icons'
import s from '../../styles/store.module.css'

export default function Header() {
  const { settings } = useSettings()
  const { count, setOpen } = useCart()
  const { pathname } = useLocation()
  const insta = instagramUrl(settings.instagram_username)
  const base = pathname.startsWith('/demo') ? '/demo' : ''
  const link = (to, label, active) => (
    <Link to={to} className={`${s.navLink} ${active ? s.navLinkActive : ''}`}>
      {label}
    </Link>
  )

  return (
    <header className={s.header}>
      <div className={`container ${s.headerInner}`}>
        <Link to={base || '/'} className={s.brand}>
          {settings.logo_url && <img className={s.logo} src={settings.logo_url} alt="" />}
          <span>{settings.store_name}</span>
        </Link>
        <nav className={s.nav} aria-label="Principal">
          {link(base || '/', 'Catálogo', pathname === '/' || pathname === '/demo')}
          {link('/contacto', 'Dónde estamos', pathname === '/contacto')}
        </nav>
        <div className={s.headerRight}>
          <span className={s.hideSm}>
            <OpenBadge compact />
          </span>
          {insta && (
            <a className={s.iconBtn} href={insta} target="_blank" rel="noopener noreferrer" aria-label="Instagram (se abre en una pestaña nueva)">
              <InstagramIcon />
            </a>
          )}
          {settings.orders_enabled && (
            <button className={s.iconBtn} onClick={() => setOpen(true)} aria-label={`Ver pedido${count ? ` (${count})` : ''}`}>
              <CartIcon />
              {count > 0 && <b className={s.cartCount}>{count}</b>}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
