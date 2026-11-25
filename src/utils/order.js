import { formatMoney } from './format'

/**
 * Arma el texto del pedido para WhatsApp.
 * Los precios ya vienen calculados desde la base (vista catalog_products.final_price).
 */
export function buildOrderMessage({ lines, mode, name, address, notes, payment, subtotal, shipping, total, currency, storeName, hasAdult }) {
  const money = (n) => formatMoney(n, currency)
  const out = []
  out.push(`Hola${storeName ? ` ${storeName}` : ''}! Quiero hacer un pedido 🛒`)
  out.push('')
  for (const l of lines) {
    const pres = l.product.presentation ? ` (${l.product.presentation})` : ''
    out.push(`• ${l.qty} x ${l.product.name}${pres} — ${money(l.product.final_price * l.qty)}`)
  }
  out.push('')
  out.push(`Subtotal: ${money(subtotal)}`)
  if (mode === 'envio') out.push(`Envío: ${shipping > 0 ? money(shipping) : 'sin cargo'}`)
  out.push(`*Total: ${money(total)}*`)
  out.push('')
  out.push(`Modalidad: ${mode === 'envio' ? 'Envío a domicilio 🛵' : 'Retiro en el local 🏪'}`)
  if (mode === 'envio' && address) out.push(`Dirección: ${address}`)
  if (name) out.push(`Nombre: ${name}`)
  if (payment) out.push(`Pago: ${payment}`)
  if (notes) out.push(`Notas: ${notes}`)
  if (hasAdult) out.push('⚠️ Incluye productos +18 (venta solo a mayores de edad).')
  return out.join('\n')
}
