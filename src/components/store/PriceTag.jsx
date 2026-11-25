import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useMoney } from '../../context/SettingsContext'
import s from '../../styles/store.module.css'

/**
 * Precio final (ya calculado en la base) destacado + original tachado + cartelito "-10% Campaña".
 * El precio "salta" cuando cambia (nueva campaña, nuevo descuento).
 */
export default function PriceTag({ product, big = false }) {
  const money = useMoney()
  const first = useRef(true)
  useEffect(() => {
    first.current = false
  }, [])
  const pct = Math.round(Number(product.discount_percent) || 0)
  const hasDiscount = pct > 0 && Number(product.final_price) < Number(product.price)

  return (
    <div className={`${s.price} ${big ? s.priceBig : ''}`}>
      <motion.span
        key={product.final_price}
        className={s.priceFinal}
        initial={first.current ? false : { scale: 1.45, y: -8, rotate: -4 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 14 }}
      >
        {money(product.final_price)}
      </motion.span>
      {hasDiscount && (
        <>
          <span className={s.priceOld}>
            <span className="visually-hidden">Precio original </span>
            {money(product.price)}
          </span>
          <span className={s.sticker}>
            -{pct}%{product.discount_label ? ` ${product.discount_label}` : ''}
          </span>
        </>
      )}
    </div>
  )
}
