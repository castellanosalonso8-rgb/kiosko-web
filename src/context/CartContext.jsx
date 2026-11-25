import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { local } from '../utils/safeStorage'

const KEY = 'kiosko-cart-v1'
const CartContext = createContext(null)

const readStored = () => {
  try {
    const parsed = JSON.parse(local.get(KEY, '{}'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Carrito liviano en el cliente: solo guarda { id: cantidad }.
 * Nombre, precio final y disponibilidad se toman SIEMPRE del catálogo actual.
 */
export function CartProvider({ products, children }) {
  const [qtys, setQtys] = useState(readStored)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    local.set(KEY, JSON.stringify(qtys))
  }, [qtys])

  const lines = useMemo(
    () =>
      Object.entries(qtys)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
        .filter((l) => l.product && l.product.in_stock && l.qty > 0),
    [qtys, products]
  )

  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.product.final_price * l.qty, 0)

  const setQty = useCallback((id, qty) => {
    setQtys((q) => {
      const next = { ...q }
      const n = Math.max(0, Math.min(99, Math.floor(qty)))
      if (n === 0) delete next[id]
      else next[id] = n
      return next
    })
  }, [])
  const add = useCallback((id, n = 1) => setQtys((q) => ({ ...q, [id]: Math.min(99, (q[id] || 0) + n) })), [])
  const clear = useCallback(() => setQtys({}), [])
  const qtyOf = useCallback((id) => qtys[id] || 0, [qtys])

  const value = useMemo(
    () => ({ lines, count, subtotal, add, setQty, clear, qtyOf, open, setOpen }),
    [lines, count, subtotal, add, setQty, clear, qtyOf, open]
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
