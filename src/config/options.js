// Opciones fijas compartidas por la tienda y el panel.
export const TAG_OPTIONS = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'mas_vendido', label: 'Más vendido' },
]
export const tagLabel = (v) => TAG_OPTIONS.find((t) => t.value === v)?.label || v

export const PAYMENT_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { value: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { value: 'mercadopago', label: 'Mercado Pago', emoji: '💳' },
]

export const SERVICE_OPTIONS = [
  { value: 'sube', label: 'Carga de SUBE', emoji: '🚌' },
  { value: 'recargas', label: 'Recargas virtuales', emoji: '📱' },
  { value: 'fotocopias', label: 'Fotocopias', emoji: '🖨️' },
]

export const NOTICE_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'importante', label: 'Importante' },
  { value: 'cierre', label: 'Cierre' },
]
