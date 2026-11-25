import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useMoney, useSettings } from '../../context/SettingsContext'
import { useHours } from '../../context/HoursContext'
import { PAYMENT_OPTIONS } from '../../config/options'
import { buildOrderMessage } from '../../utils/order'
import { whatsappUrl } from '../../utils/format'
import { local } from '../../utils/safeStorage'
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon } from './Icons'
import s from '../../styles/store.module.css'

const CUSTOMER_KEY = 'kiosko-customer-v1'

/** Carrito liviano: arma el mensaje y lo manda por WhatsApp. Sin pagos online. */
export default function CartDrawer() {
  const { lines, count, subtotal, setQty, clear, open, setOpen } = useCart()
  const { settings: st } = useSettings()
  const { status } = useHours()
  const money = useMoney()

  const saved = useMemo(() => {
    try {
      return JSON.parse(local.get(CUSTOMER_KEY, '{}')) || {}
    } catch {
      return {}
    }
  }, [])
  const [mode, setMode] = useState(saved.mode === 'envio' ? 'envio' : 'retiro')
  const [name, setName] = useState(saved.name || '')
  const [address, setAddress] = useState(saved.address || '')
  const [payment, setPayment] = useState(saved.payment || '')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    local.set(CUSTOMER_KEY, JSON.stringify({ mode, name, address, payment }))
  }, [mode, name, address, payment])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, setOpen])

  // Si el dueño apagó el envío, volvemos a "retiro"
  const effMode = st.delivery_enabled ? mode : 'retiro'
  const shipping = effMode === 'envio' ? Number(st.delivery_fee) || 0 : 0
  const total = subtotal + shipping
  const minOrder = Number(st.min_order) || 0
  const belowMin = minOrder > 0 && subtotal < minOrder
  const needsAddress = effMode === 'envio' && !address.trim()
  const hasAdult = lines.some((l) => l.product.category?.is_adult)
  const payments = PAYMENT_OPTIONS.filter((p) => (st.payment_methods || []).includes(p.value))

  const link = whatsappUrl(
    st.whatsapp_number,
    buildOrderMessage({
      lines,
      mode: effMode,
      name: name.trim(),
      address: address.trim(),
      notes: notes.trim(),
      payment: payments.find((p) => p.value === payment)?.label || '',
      subtotal,
      shipping,
      total,
      currency: st.currency,
      storeName: st.store_name,
      hasAdult,
    })
  )
  const blocked = !link || belowMin || needsAddress || count === 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={s.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.aside
            className={s.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Tu pedido"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={s.drawerHead}>
              <h2>Tu pedido</h2>
              <button className={s.closeInline} onClick={() => setOpen(false)} aria-label="Cerrar">
                <CloseIcon />
              </button>
            </header>

            {count === 0 ? (
              <p className={s.drawerEmpty}>Todavía no agregaste nada. ¡Tocá el + en los productos!</p>
            ) : (
              <div className={s.drawerBody}>
                <ul className={s.cartList}>
                  {lines.map(({ product, qty }) => (
                    <li key={product.id} className={s.cartLine}>
                      <div className={s.cartLineInfo}>
                        <b>{product.name}</b>
                        {product.presentation && <span className="hint">{product.presentation}</span>}
                        <span className={s.cartLinePrice}>{money(product.final_price * qty)}</span>
                      </div>
                      <div className={s.stepper} role="group" aria-label={`Cantidad de ${product.name}`}>
                        <button type="button" onClick={() => setQty(product.id, qty - 1)} aria-label="Menos">
                          {qty === 1 ? <TrashIcon width={16} height={16} /> : <MinusIcon width={16} height={16} />}
                        </button>
                        <output>{qty}</output>
                        <button type="button" onClick={() => setQty(product.id, qty + 1)} aria-label="Más">
                          <PlusIcon width={16} height={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <fieldset className={s.modeSwitch}>
                  <legend className="visually-hidden">Cómo lo querés</legend>
                  <label className={effMode === 'retiro' ? s.modeOn : ''}>
                    <input type="radio" name="mode" checked={effMode === 'retiro'} onChange={() => setMode('retiro')} />
                    🏪 Retiro
                  </label>
                  {st.delivery_enabled && (
                    <label className={effMode === 'envio' ? s.modeOn : ''}>
                      <input type="radio" name="mode" checked={effMode === 'envio'} onChange={() => setMode('envio')} />
                      🛵 Envío
                    </label>
                  )}
                </fieldset>

                {effMode === 'envio' && (
                  <div className="field">
                    <label htmlFor="c-addr">Dirección de entrega *</label>
                    <input id="c-addr" className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle y número, piso/depto" autoComplete="street-address" />
                    {st.delivery_zone && <span className="hint">Zona de envío: {st.delivery_zone}</span>}
                  </div>
                )}
                <div className="field">
                  <label htmlFor="c-name">Tu nombre (opcional)</label>
                  <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
                </div>
                {payments.length > 0 && (
                  <div className="field">
                    <label htmlFor="c-pay">Cómo pagás (opcional)</label>
                    <select id="c-pay" className="input" value={payment} onChange={(e) => setPayment(e.target.value)}>
                      <option value="">A coordinar</option>
                      {payments.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.emoji} {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="c-notes">Aclaraciones (opcional)</label>
                  <input id="c-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: sin hielo, tocar timbre…" />
                </div>

                {hasAdult && <p className={s.adultInline}>🔞 Tu pedido incluye productos +18: venta solo a mayores de edad.</p>}

                <dl className={s.totals}>
                  <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
                  {effMode === 'envio' && (
                    <div><dt>Envío</dt><dd>{shipping > 0 ? money(shipping) : 'Sin cargo'}</dd></div>
                  )}
                  <div className={s.totalRow}><dt>Total</dt><dd>{money(total)}</dd></div>
                </dl>

                {belowMin && (
                  <p className="error-text" role="alert">
                    El pedido mínimo es {money(minOrder)}. Te faltan {money(minOrder - subtotal)}.
                  </p>
                )}
                {status && !status.open && (
                  <p className="hint">Ahora estamos cerrados: te respondemos apenas abramos.</p>
                )}
                {!st.whatsapp_number && <p className="hint">El WhatsApp del kiosko todavía no está configurado.</p>}
              </div>
            )}

            {count > 0 && (
              <footer className={s.drawerFoot}>
                <a
                  className={`btn btn-whatsapp btn-block ${blocked ? s.disabledLink : ''}`}
                  href={blocked ? undefined : link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={blocked}
                  onClick={(e) => blocked && e.preventDefault()}
                >
                  <WhatsAppIcon width={20} height={20} /> Enviar pedido por WhatsApp
                </a>
                <button className="btn btn-ghost btn-sm" onClick={clear}>
                  Vaciar pedido
                </button>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
