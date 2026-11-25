import { Link } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'
import { directionsUrl, instagramUrl } from '../../utils/format'
import OpenBadge from './OpenBadge'
import { PaymentMethods } from './Chips'
import { InstagramIcon, PinIcon } from './Icons'
import s from '../../styles/store.module.css'

export default function Footer() {
  const { settings } = useSettings()
  const maps = directionsUrl(settings)
  const insta = instagramUrl(settings.instagram_username)

  return (
    <footer className={s.footer}>
      <div className="container">
        <div className={s.footerGrid}>
          <div>
            <div className={s.footerBrand}>{settings.store_name}</div>
            {settings.tagline && <p className="hint" style={{ marginTop: '0.4rem' }}>{settings.tagline}</p>}
            <div style={{ marginTop: '0.7rem' }}>
              <OpenBadge />
            </div>
          </div>

          <div>
            <h3 className={s.footerTitle}>Visitanos</h3>
            {settings.address && (
              <div className={s.infoRow}>
                <PinIcon /> <span>{settings.address}</span>
              </div>
            )}
            {maps && (
              <a className="btn btn-ghost btn-sm" href={maps} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.4rem' }}>
                <PinIcon width={16} height={16} /> Cómo llegar
              </a>
            )}
            <p style={{ marginTop: '0.6rem' }}>
              <Link to="/contacto" style={{ fontSize: '0.9rem' }}>Horarios y contacto</Link>
            </p>
          </div>

          <div>
            <h3 className={s.footerTitle}>Pagás con</h3>
            <PaymentMethods />
            {insta && (
              <a className="btn btn-ghost btn-sm" href={insta} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.7rem' }}>
                <InstagramIcon width={16} height={16} /> Instagram
              </a>
            )}
          </div>
        </div>
        <p className={s.copy}>
          © {new Date().getFullYear()} {settings.store_name}. Venta de alcohol y cigarrillos solo a mayores de 18 años.
        </p>
      </div>
    </footer>
  )
}
