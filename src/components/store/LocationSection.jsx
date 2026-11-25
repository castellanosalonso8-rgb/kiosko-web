import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useSettings, useMoney } from '../../context/SettingsContext'
import { GENERIC_MESSAGE, directionsUrl, instagramUrl, mapEmbedSrc, whatsappUrl } from '../../utils/format'
import OpenBadge from './OpenBadge'
import HoursTable from './HoursTable'
import PhotoCarousel from './PhotoCarousel'
import { PaymentMethods, Services } from './Chips'
import { InstagramIcon, PinIcon, WhatsAppIcon } from './Icons'
import s from '../../styles/store.module.css'

/** Ubicación + horarios + contacto + fotos del local, todo junto. */
export default function LocationSection() {
  const { settings: st } = useSettings()
  const money = useMoney()
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    supabase
      .from('store_photos')
      .select('*')
      .order('kind')
      .order('sort_order')
      .order('created_at')
      .then(({ data }) => data && setPhotos(data))
  }, [])

  const wa = whatsappUrl(st.whatsapp_number, GENERIC_MESSAGE)
  const insta = instagramUrl(st.instagram_username)
  const maps = directionsUrl(st)
  const embed = mapEmbedSrc(st)

  return (
    <section className={`container ${s.locationPage}`} aria-labelledby="loc-title">
      <h1 id="loc-title" className={s.sectionTitle}>Dónde estamos</h1>

      <div className={s.locGrid}>
        <div className={s.locCard}>
          {st.address && (
            <div className={s.infoRow}>
              <PinIcon /> <span>{st.address}</span>
            </div>
          )}
          <OpenBadge showDetail />
          <div className={s.actions}>
            {maps && (
              <a className="btn btn-primary" href={maps} target="_blank" rel="noopener noreferrer">
                <PinIcon width={18} height={18} /> Cómo llegar
              </a>
            )}
            {wa && (
              <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon width={18} height={18} /> WhatsApp
              </a>
            )}
            {insta && (
              <a className="btn btn-ghost" href={insta} target="_blank" rel="noopener noreferrer">
                <InstagramIcon width={18} height={18} /> Instagram
              </a>
            )}
          </div>
        </div>

        <div className={s.locCard}>
          <h2 className={s.cardTitle}>Horarios</h2>
          <HoursTable />
        </div>
      </div>

      {embed && (
        <iframe
          className={s.mapFrame}
          title="Mapa con la ubicación del kiosko"
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      <PhotoCarousel photos={photos} />

      <div className={s.locGrid}>
        {(st.payment_methods || []).length > 0 && (
          <div className={s.locCard}>
            <h2 className={s.cardTitle}>Medios de pago</h2>
            <PaymentMethods />
          </div>
        )}
        {(st.services || []).length > 0 && (
          <div className={s.locCard}>
            <h2 className={s.cardTitle}>Servicios</h2>
            <Services />
          </div>
        )}
        {st.orders_enabled && (
          <div className={s.locCard}>
            <h2 className={s.cardTitle}>Pedidos</h2>
            <ul className={s.plain}>
              <li>🏪 Retiro en el local</li>
              {st.delivery_enabled && (
                <li>
                  🛵 Envío{st.delivery_zone ? ` · ${st.delivery_zone}` : ''}
                  {Number(st.delivery_fee) > 0 ? ` · ${money(st.delivery_fee)}` : ' · sin cargo'}
                </li>
              )}
              {Number(st.min_order) > 0 && <li>🧾 Pedido mínimo: {money(st.min_order)}</li>}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
