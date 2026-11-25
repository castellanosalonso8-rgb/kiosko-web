import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useMoney, useSettings } from '../../context/SettingsContext'
import { CartIcon } from './Icons'
import s from '../../styles/store.module.css'

/** Barra flotante "Ver pedido" (aparece cuando hay productos). */
export default function CartBar() {
  const { count, subtotal, setOpen, open } = useCart()
  const { settings } = useSettings()
  const money = useMoney()
  const show = settings.orders_enabled && count > 0 && !open
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          className={s.cartBar}
          onClick={() => setOpen(true)}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          <span className={s.cartBarIcon}>
            <CartIcon width={22} height={22} />
            <motion.b key={count} initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
              {count}
            </motion.b>
          </span>
          <span className={s.cartBarText}>Ver pedido</span>
          <span className={s.cartBarTotal}>{money(subtotal)}</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
