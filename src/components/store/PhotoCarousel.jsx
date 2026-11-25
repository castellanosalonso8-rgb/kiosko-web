import { useRef } from 'react'
import { ChevronIcon } from './Icons'
import s from '../../styles/store.module.css'

const KIND = { front: 'Frente', interior: 'Interior' }

/** Carrusel con scroll-snap (se desliza con el dedo) + flechas en escritorio. */
export default function PhotoCarousel({ photos }) {
  const ref = useRef(null)
  if (!photos.length) return null
  const go = (dir) => {
    const el = ref.current
    el?.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }
  return (
    <div className={s.carousel} role="region" aria-roledescription="carrusel" aria-label="Fotos del local">
      <div className={s.carouselTrack} ref={ref} tabIndex={0}>
        {photos.map((p) => (
          <figure key={p.id} className={s.slide}>
            <img src={p.image_url} alt={p.caption || `Foto del ${KIND[p.kind]?.toLowerCase() || 'local'}`} loading="lazy" />
            <figcaption>
              <span className={s.pill}>{KIND[p.kind] || 'Local'}</span>
              {p.caption && <span>{p.caption}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button className={`${s.carouselBtn} ${s.carouselPrev}`} onClick={() => go(-1)} aria-label="Foto anterior">
            <ChevronIcon dir="left" />
          </button>
          <button className={`${s.carouselBtn} ${s.carouselNext}`} onClick={() => go(1)} aria-label="Foto siguiente">
            <ChevronIcon />
          </button>
        </>
      )}
    </div>
  )
}
