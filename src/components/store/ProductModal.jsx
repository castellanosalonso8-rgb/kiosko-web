import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabaseClient'
import { useSettings, useMoney } from '../../context/SettingsContext'
import { useCart } from '../../context/CartContext'
import { productMessage, whatsappUrl } from '../../utils/format'
import { session } from '../../utils/safeStorage'
import PriceTag from './PriceTag'
import TagBadges from './TagBadges'
import { CloseIcon, MinusIcon, PlusIcon, WhatsAppIcon } from './Icons'
import s from '../../styles/store.module.css'

export default function ProductModal({ product, onClose }) {
  const { settings } = useSettings()
  const money = useMoney()
  const { add, setOpen } = useCart()
  const closeRef = useRef(null)
  const [qty, setQty] = useState(1)
  const soldOut = !product.in_stock

  // Esc para cerrar, bloquear scroll del fondo, foco en el botón cerrar
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // Cuenta una vista por producto y por sesión (para el resumen del panel)
  useEffect(() => {
    const k = `viewed:${product.id}`
    if (session.get(k)) return
    session.set(k, '1')
    supabase.rpc('register_product_view', { p_id: product.id }).then(() => {}, () => {})
  }, [product.id])

  const link = whatsappUrl(
    settings.whatsapp_number,
    productMessage(settings.whatsapp_default_message, product.name)
  )

  const addToOrder = () => {
    add(product.id, qty)
    onClose()
    setOpen(true)
  }

  return (
    <motion.div
      className={s.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} className={s.close} onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </button>

        <div className={s.modalImg}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className={s.noImage} aria-hidden="true">
              {product.kind === 'combo' ? '🎁' : product.name.charAt(0)}
            </div>
          )}
        </div>

        <div className={s.modalBody}>
          <TagBadges product={product} />
          {product.category && <span className={s.cardCategory}>{product.category.name}</span>}
          <h2 className={s.modalTitle}>{product.name}</h2>
          {product.presentation && <p className={s.cardPres}>{product.presentation}</p>}
          <PriceTag product={product} big />
          {product.description && <p className={s.modalDesc}>{product.description}</p>}

          {product.category?.is_adult && (
            <p className={s.adultInline}>🔞 Venta solo a mayores de 18 años.</p>
          )}

          <p className={`${s.stock} ${soldOut ? s.stockOut : ''}`}>
            {soldOut
              ? 'Agotado por el momento'
              : product.stock != null && product.stock > 0 && product.stock <= 5
                ? `Disponible · quedan ${product.stock}`
                : 'Disponible'}
          </p>

          {settings.orders_enabled && !soldOut && (
            <div className={s.modalOrder}>
              <div className={s.stepper} role="group" aria-label="Cantidad">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">
                  <MinusIcon width={18} height={18} />
                </button>
                <output aria-live="polite">{qty}</output>
                <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Más">
                  <PlusIcon width={18} height={18} />
                </button>
              </div>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addToOrder}>
                Agregar · {money(product.final_price * qty)}
              </button>
            </div>
          )}

          {link && (
            <a className="btn btn-ghost btn-block" href={link} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon width={18} height={18} /> Consultar por WhatsApp
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
