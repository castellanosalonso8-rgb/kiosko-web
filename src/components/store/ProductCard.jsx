import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../../context/SettingsContext'
import { useCart } from '../../context/CartContext'
import PriceTag from './PriceTag'
import TagBadges from './TagBadges'
import { PlusIcon } from './Icons'
import s from '../../styles/store.module.css'

export const cardVariants = {
  hidden: { opacity: 0, scale: 0.82, y: 14 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 20 } },
}

/** variant: 'grid' (tarjeta) | 'list' (fila compacta, más productos por pantalla en el celu) */
export default function ProductCard({ product, onOpen, variant = 'grid' }) {
  const { settings } = useSettings()
  const { add, qtyOf } = useCart()
  const [bump, setBump] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const soldOut = !product.in_stock
  const qty = qtyOf(product.id)
  const canOrder = settings.orders_enabled && !soldOut

  const onAdd = (e) => {
    e.stopPropagation()
    add(product.id)
    setBump(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setBump(false), 450)
  }

  return (
    <motion.li variants={cardVariants} className={`${s.item} ${variant === 'list' ? s.itemList : ''}`}>
      <div className={`${s.card} ${soldOut ? s.soldOut : ''}`}>
        <button
          type="button"
          className={s.cardMain}
          onClick={() => onOpen(product)}
          aria-label={`Ver detalle de ${product.name}`}
        >
          <div className={s.cardImgWrap}>
            {product.image_url ? (
              <img className={s.cardImg} src={product.image_url} alt="" loading="lazy" />
            ) : (
              <div className={s.noImage} aria-hidden="true">
                {product.kind === 'combo' ? '🎁' : product.name.charAt(0)}
              </div>
            )}
            {soldOut && <span className={s.soldBadge}>Agotado</span>}
          </div>
          <div className={s.cardBody}>
            <TagBadges product={product} />
            <span className={s.cardName}>{product.name}</span>
            {product.presentation && <span className={s.cardPres}>{product.presentation}</span>}
            <PriceTag product={product} />
          </div>
        </button>
        {canOrder && (
          <button
            type="button"
            className={`${s.addBtn} ${bump ? s.bump : ''}`}
            onClick={onAdd}
            aria-label={`Agregar ${product.name} al pedido${qty ? ` (ya tenés ${qty})` : ''}`}
          >
            {qty > 0 ? <span className={s.addQty}>{qty}</span> : <PlusIcon width={20} height={20} />}
          </button>
        )}
      </div>
    </motion.li>
  )
}
