/**
 * RECURSOS DEL PANEL. Sumar una sección nueva = declarar un objeto acá y agregarlo en sections.jsx.
 *
 * { title, singular, icon, table, activeField, order:[[col,asc]], search:[…], fields:[…],
 *   check:(values)=>errores, card:(row,ctx)=>({image,title,sub,badges,warn}), loadExtra?(supabase) }
 * Extras: filter/forced (comparten tabla, ej. productos y combos), actions, header, beforeSave, defaults.
 */
import { supabase } from '../lib/supabaseClient'
import { slugify, cleanPhone, cleanInstagram, extractEmbedSrc } from '../utils/format'
import { NOTICE_TYPES, PAYMENT_OPTIONS, SERVICE_OPTIONS, TAG_OPTIONS, tagLabel } from '../config/options'
import { themes } from '../themes'
import { nowInBA, describeSlots, validateSlots } from '../lib/hours'
import { fireConfetti } from './CrudPage'
import ThemeSwitcher from './ThemeSwitcher'

const must = ({ error }) => {
  if (error) throw error
}

/* ======================= PRODUCTOS y COMBOS ======================= */
async function loadProductsExtra(sb) {
  const [c, pr] = await Promise.all([
    sb.from('categories').select('id, name').order('sort_order').order('name'),
    sb.from('catalog_products').select('id, final_price, discount_percent, discount_label'),
  ])
  return {
    categories: c.data || [],
    prices: Object.fromEntries((pr.data || []).map((x) => [x.id, x])), // precio final calculado en la base
  }
}

// Si eligió "+ Crear categoría nueva…" la creamos antes de guardar el producto
async function resolveNewCategory(payload, values, { ctx }) {
  if (values.category_id !== '__new__') return payload
  const name = values.new_category.trim()
  const slug = slugify(name)
  const existing = (ctx.categories || []).find((c) => slugify(c.name) === slug)
  if (existing) return { ...payload, category_id: existing.id }
  const { data, error } = await supabase.from('categories').insert({ name, slug }).select().single()
  if (error) throw error
  return { ...payload, category_id: data.id }
}

const productCard = (row, ctx) => {
  const p = ctx.prices?.[row.id]
  const price = p ? ctx.money(p.final_price) : ctx.money(row.price)
  const off = p && Number(p.discount_percent) > 0 ? ` (-${Math.round(p.discount_percent)}%${p.discount_label ? ` ${p.discount_label}` : ''})` : ''
  return {
    image: row.image_url,
    initial: row.kind === 'combo' ? '🎁' : undefined,
    title: row.name,
    sub: [row.presentation, row.category?.name || 'Sin categoría', price + off].filter(Boolean).join(' · '),
    badges: [
      row.in_stock ? { text: 'Disponible', tone: 'ok' } : { text: 'Agotado', tone: 'warn' },
      row.stock != null && { text: `Cantidad: ${row.stock}` },
      row.is_featured && 'Destacado',
      ...(row.tags || []).map(tagLabel),
      !row.is_active && { text: 'Oculto', tone: 'off' },
    ].filter(Boolean),
  }
}

const stockAction = {
  label: (row) => (row.in_stock ? '🚫 Marcar agotado' : '✅ Marcar disponible'),
  run: async (row, { reload }) => {
    must(await supabase.from('products').update({ in_stock: !row.in_stock }).eq('id', row.id))
    reload()
  },
}

const productFields = (kind) => [
  { name: 'image_url', type: 'image', label: 'Foto', folder: 'products' },
  { name: 'name', type: 'text', label: kind === 'combo' ? 'Nombre del combo' : 'Nombre', required: true, maxLength: 80, placeholder: kind === 'combo' ? 'Gaseosa + papas' : 'Gaseosa cola' },
  ...(kind === 'product'
    ? [{ name: 'presentation', type: 'text', label: 'Presentación', maxLength: 40, placeholder: '500 ml, 120 g, x12…', hint: 'Opcional. Se muestra al lado del nombre.' }]
    : []),
  {
    name: 'category_id',
    type: 'select',
    label: 'Categoría',
    emptyLabel: 'Sin categoría',
    options: (ctx) => [...(ctx.categories || []).map((c) => ({ value: c.id, label: c.name })), { value: '__new__', label: '+ Crear categoría nueva…' }],
  },
  { name: 'new_category', type: 'text', label: 'Nombre de la nueva categoría', virtual: true, required: true, maxLength: 40, showIf: (v) => v.category_id === '__new__' },
  { name: 'description', type: 'textarea', label: kind === 'combo' ? 'Qué incluye' : 'Descripción', maxLength: 400, placeholder: kind === 'combo' ? 'Gaseosa 500 ml + papas fritas 80 g' : '' },
  { name: 'price', type: 'number', label: kind === 'combo' ? 'Precio del combo ($)' : 'Precio ($)', required: true, min: 0.01, hint: kind === 'combo' ? 'Precio propio del combo.' : undefined },
  { name: 'discount_percent', type: 'number', label: 'Descuento propio (%)', integer: true, min: 0, max: 100, zeroIfEmpty: true, placeholder: '0', hint: 'Si hay una campaña activa se aplica el mayor, no se suman.' },
  { name: 'in_stock', type: 'checkbox', label: 'Disponible', hint: 'Destildalo para marcarlo como Agotado.', default: true },
  { name: 'stock', type: 'number', label: 'Cantidad (opcional)', integer: true, min: 0, hint: 'Si la cargás y es 5 o menos, se muestra “quedan N”.' },
  { name: 'tags', type: 'multi', label: 'Etiquetas', options: TAG_OPTIONS },
  { name: 'is_featured', type: 'checkbox', label: 'Destacado (aparece arriba en la web)' },
]

const makeProductResource = (kind) => ({
  title: kind === 'combo' ? 'Combos y promos' : 'Productos',
  singular: kind === 'combo' ? 'combo' : 'producto',
  icon: kind === 'combo' ? '🎁' : '🛒',
  table: 'products',
  filter: { kind },
  forced: { kind },
  activeField: 'is_active',
  activeLabel: 'Visible en la web',
  order: [['created_at', false]],
  search: ['name', 'presentation'],
  select: '*, category:categories(name)',
  loadExtra: loadProductsExtra,
  fields: productFields(kind),
  beforeSave: resolveNewCategory,
  card: productCard,
  actions: [stockAction],
  deleteMessage: (row) => `Vas a borrar “${row.name}” de forma permanente. Si solo querés que no se vea, usá “Ocultar”.`,
})

export const products = makeProductResource('product')
export const combos = makeProductResource('combo')

/* ======================= CATEGORÍAS ======================= */
export const categories = {
  title: 'Categorías',
  singular: 'categoría', fem: true,
  icon: '🗂️',
  table: 'categories',
  activeField: 'is_hidden',
  activeInverted: true,
  showLabel: 'Mostrar',
  hideLabel: 'Ocultar',
  onLabel: 'Categoría visible en la web',
  offLabel: 'Categoría oculta (y sus productos)',
  order: [['sort_order', true], ['name', true]],
  search: ['name'],
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true, maxLength: 40, placeholder: 'Golosinas' },
    { name: 'emoji', type: 'text', label: 'Emoji (opcional)', maxLength: 4, placeholder: '🍬' },
    { name: 'sort_order', type: 'number', label: 'Orden', integer: true, zeroIfEmpty: true, default: '0', hint: 'Número chico = aparece primero.' },
    { name: 'is_adult', type: 'checkbox', label: '+18 (alcohol, cigarrillos…)', hint: 'Muestra el aviso de venta solo a mayores de edad.' },
    { name: 'is_hidden', type: 'checkbox', label: 'Ocultar de la web', hint: 'Se ocultan también sus productos.' },
  ],
  beforeSave: async (payload) => ({ ...payload, slug: slugify(payload.name) }),
  card: (row) => ({
    title: `${row.emoji ? `${row.emoji} ` : ''}${row.name}`,
    sub: `Orden ${row.sort_order}`,
    badges: [row.is_adult && { text: '+18', tone: 'warn' }, row.is_hidden && { text: 'Oculta', tone: 'off' }].filter(Boolean),
  }),
  deleteMessage: (row) => `Vas a borrar “${row.name}”. Sus productos NO se borran: quedan “Sin categoría”.`,
}

/* ======================= CAMPAÑAS ======================= */
const campaignState = (c) => {
  const today = nowInBA().dateStr
  if (!c.is_active) return { text: 'Inactiva', tone: 'off' }
  if (c.ends_on && c.ends_on < today) return { text: 'Vencida', tone: 'warn' }
  if (c.starts_on && c.starts_on > today) return { text: 'Programada' }
  return { text: 'En vigencia', tone: 'ok' }
}
const fmt = (d) => (d ? d.split('-').reverse().join('/') : '')

export const campaigns = {
  title: 'Campañas',
  singular: 'campaña', fem: true,
  icon: '🎉',
  table: 'campaigns',
  activeField: 'is_active',
  activeLabel: 'Campaña activa',
  showLabel: 'Activar',
  hideLabel: 'Desactivar',
  onLabel: '¡Campaña activada!',
  offLabel: 'Campaña desactivada',
  confettiOnActivate: true,
  intro: 'Una campaña aplica un % de descuento a categorías y/o productos entre dos fechas. El precio final lo calcula la base de datos.',
  order: [['created_at', false]],
  search: ['name'],
  header: ThemeSwitcher,
  loadExtra: async (sb) => {
    const [c, p] = await Promise.all([
      sb.from('categories').select('id, name').order('sort_order').order('name'),
      sb.from('products').select('id, name').order('name'),
    ])
    return { categories: c.data || [], productsList: p.data || [] }
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true, maxLength: 60, placeholder: 'San Valentín' },
    { name: 'theme_id', type: 'select', label: 'Tema asociado (opcional)', emptyLabel: 'Sin tema', options: themes.map((t) => ({ value: t.id, label: `${t.emoji} ${t.name}` })) },
    { name: 'banner_message', type: 'text', label: 'Mensaje del banner', maxLength: 100, placeholder: '10% en chocolates por San Valentín' },
    { name: 'starts_on', type: 'date', label: 'Desde' },
    { name: 'ends_on', type: 'date', label: 'Hasta (inclusive)' },
    { name: 'discount_percent', type: 'number', label: 'Descuento (%)', required: true, integer: true, min: 1, max: 100 },
    { name: 'apply_to_all', type: 'checkbox', label: 'Aplicar a todo el kiosko' },
    { name: 'category_ids', type: 'multi', label: 'Categorías', showIf: (v) => !v.apply_to_all, options: (ctx) => (ctx.categories || []).map((c) => ({ value: c.id, label: c.name })) },
    { name: 'product_ids', type: 'relmulti', label: 'Productos puntuales', showIf: (v) => !v.apply_to_all, options: (ctx) => (ctx.productsList || []).map((p) => ({ value: p.id, label: p.name })) },
  ],
  check: (v) => {
    const e = {}
    if (v.starts_on && v.ends_on && v.ends_on < v.starts_on) e.ends_on = 'Tiene que terminar después de que empieza'
    if (!v.apply_to_all && !(v.category_ids || []).length && !(v.product_ids || []).length)
      e.category_ids = 'Elegí al menos una categoría o producto (o marcá “todo el kiosko”)'
    return e
  },
  card: (row, ctx) => {
    const st = campaignState(row)
    const cats = (row.category_ids || []).map((id) => (ctx.categories || []).find((c) => c.id === id)?.name).filter(Boolean)
    const scope = row.apply_to_all ? 'todo el kiosko' : [cats.join(', '), (row.product_ids || []).length ? `${row.product_ids.length} producto(s)` : ''].filter(Boolean).join(' + ')
    return {
      title: row.name,
      sub: `-${row.discount_percent}% en ${scope || '—'}${row.starts_on || row.ends_on ? ` · ${fmt(row.starts_on) || '…'} → ${fmt(row.ends_on) || '…'}` : ''}`,
      badges: [st, row.theme_id && { text: `Tema: ${themes.find((t) => t.id === row.theme_id)?.name || row.theme_id}` }].filter(Boolean),
    }
  },
  // "Activar tema + campaña" en un toque
  actions: [
    {
      label: '🎉 Activar tema + campaña',
      run: async (row, { toast, reload, reloadSettings }) => {
        if (row.theme_id) must(await supabase.from('store_settings').upsert({ id: 1, active_theme: row.theme_id }))
        must(await supabase.from('campaigns').update({ is_active: true }).eq('id', row.id))
        await reloadSettings()
        await reload()
        fireConfetti()
        toast.success(row.theme_id ? 'Tema y campaña activados' : 'Campaña activada (no tiene tema asociado)')
      },
    },
  ],
}

/* ======================= DÍAS ESPECIALES ======================= */
export const specialDays = {
  title: 'Días especiales',
  singular: 'día especial',
  icon: '📅',
  table: 'special_days',
  intro: 'Feriados o cierres: pisan el horario semanal ese día.',
  order: [['day', true]],
  fields: [
    { name: 'day', type: 'date', label: 'Fecha', required: true },
    { name: 'reason', type: 'text', label: 'Motivo', required: true, maxLength: 60, placeholder: 'Feriado, vacaciones, inventario…' },
    { name: 'is_closed', type: 'checkbox', label: 'Cerrado todo el día', default: true },
    { name: 'slots', type: 'slots', label: 'Horario de ese día', showIf: (v) => !v.is_closed, required: (v) => !v.is_closed, clearWhenHidden: true },
  ],
  check: (v) => (!v.is_closed && v.slots?.length ? { slots: validateSlots(v.slots) || undefined } : {}),
  card: (row) => ({
    title: `${fmt(row.day)} · ${row.reason}`,
    sub: row.is_closed ? 'Cerrado' : describeSlots(row.slots),
    badges: [row.day < nowInBA().dateStr && { text: 'Pasado', tone: 'off' }].filter(Boolean),
  }),
}

/* ======================= FOTOS DEL LOCAL ======================= */
export const photos = {
  title: 'Fotos del local',
  singular: 'foto', fem: true,
  icon: '📷',
  table: 'store_photos',
  intro: 'Fotos del frente y del interior: aparecen en el carrusel de “Dónde estamos”.',
  order: [['kind', true], ['sort_order', true], ['created_at', false]],
  fields: [
    { name: 'image_url', type: 'image', label: 'Foto', folder: 'store', required: true, wide: true },
    { name: 'kind', type: 'select', label: 'Dónde es', noEmpty: true, default: 'front', options: [{ value: 'front', label: 'Frente' }, { value: 'interior', label: 'Interior' }] },
    { name: 'caption', type: 'text', label: 'Epígrafe (opcional)', maxLength: 80 },
    { name: 'sort_order', type: 'number', label: 'Orden', integer: true, zeroIfEmpty: true, default: '0' },
  ],
  card: (row) => ({
    image: row.image_url,
    title: row.caption || (row.kind === 'front' ? 'Frente del local' : 'Interior del local'),
    sub: row.kind === 'front' ? 'Frente' : 'Interior',
  }),
}

/* ======================= CONFIGURACIÓN (fila única) ======================= */
export const avisoFields = [
  { name: 'notice_enabled', type: 'checkbox', label: 'Mostrar aviso', hint: 'Banner arriba de la web. Los “importante” y “cierre” se destacan.' },
  { name: 'notice_text', type: 'textarea', label: 'Texto del aviso', maxLength: 240, required: (v) => v.notice_enabled, hint: 'Obligatorio cuando el aviso está activado.', emptyString: false },
  { name: 'notice_type', type: 'select', label: 'Tipo', noEmpty: true, default: 'info', options: NOTICE_TYPES },
  { name: 'notice_starts_on', type: 'date', label: 'Mostrar desde (opcional)' },
  { name: 'notice_ends_on', type: 'date', label: 'Mostrar hasta (opcional)' },
]
export const avisoCheck = (v) => {
  const e = {}
  if (v.notice_enabled && !v.notice_text.trim()) e.notice_text = 'Escribí el texto del aviso para poder activarlo'
  if (v.notice_starts_on && v.notice_ends_on && v.notice_ends_on < v.notice_starts_on) e.notice_ends_on = 'Tiene que terminar después de que empieza'
  return e
}

export const datosFields = [
  { name: 'h1', type: 'heading', label: 'Identidad' },
  { name: 'store_name', type: 'text', label: 'Nombre del kiosko', required: true, maxLength: 60 },
  { name: 'logo_url', type: 'image', label: 'Logo', folder: 'branding' },
  { name: 'tagline', type: 'text', label: 'Eslogan', maxLength: 80, placeholder: 'Siempre abierto para vos' },
  { name: 'currency', type: 'select', label: 'Moneda', noEmpty: true, default: 'ARS', options: [{ value: 'ARS', label: 'Peso argentino (ARS)' }, { value: 'USD', label: 'Dólar (USD)' }, { value: 'UYU', label: 'Peso uruguayo (UYU)' }, { value: 'CLP', label: 'Peso chileno (CLP)' }] },

  { name: 'h2', type: 'heading', label: 'Contacto' },
  { name: 'whatsapp_number', type: 'text', label: 'Número de WhatsApp', inputMode: 'tel', placeholder: '5491112345678', hint: 'Con código de país, sin “+” ni espacios. Argentina celular: 549 + código de área + número.' },
  { name: 'whatsapp_default_message', type: 'textarea', label: 'Mensaje de WhatsApp para cada producto', emptyString: true, hint: 'Escribí {producto} donde quieras que aparezca el nombre.' },
  { name: 'instagram_username', type: 'text', label: 'Instagram', placeholder: 'mikiosko', hint: 'Sin @. También podés pegar el link del perfil.' },

  { name: 'h3', type: 'heading', label: 'Ubicación' },
  { name: 'address', type: 'text', label: 'Dirección', placeholder: 'Calle 123, Ciudad, Provincia', hint: 'Se usa para el mapa y el botón “Cómo llegar”.' },
  { name: 'map_embed_url', type: 'text', label: 'Link de embed de Google Maps (opcional)', hint: 'Si la dirección no alcanza: Google Maps → Compartir → Insertar un mapa → copiá el link (o el iframe entero).' },
  { name: 'map_coords', type: 'text', label: 'Coordenadas exactas (opcional)', placeholder: '-38.0055, -57.5426', pattern: '^\\s*-?\\d{1,3}(\\.\\d+)?\\s*,\\s*-?\\d{1,3}(\\.\\d+)?\\s*$', patternMsg: 'Formato: -38.0055, -57.5426 (latitud, longitud)', hint: 'En Google Maps: clic derecho sobre el lugar → copiar coordenadas.' },

  { name: 'h4', type: 'heading', label: 'Pedidos por WhatsApp y envío' },
  { name: 'orders_enabled', type: 'checkbox', label: 'Habilitar pedidos (carrito)', hint: 'Si lo apagás, la web queda solo como catálogo con botón de consulta.' },
  { name: 'min_order', type: 'number', label: 'Pedido mínimo ($)', min: 0, zeroIfEmpty: true, placeholder: '0' },
  { name: 'delivery_enabled', type: 'checkbox', label: 'Hacemos envíos' },
  { name: 'delivery_fee', type: 'number', label: 'Costo de envío ($)', min: 0, zeroIfEmpty: true, placeholder: '0' },
  { name: 'delivery_zone', type: 'text', label: 'Zona de envío', maxLength: 120, placeholder: 'Hasta 10 cuadras a la redonda' },

  { name: 'h5', type: 'heading', label: 'Pagos y servicios' },
  { name: 'payment_methods', type: 'multi', label: 'Medios de pago aceptados', options: PAYMENT_OPTIONS },
  { name: 'services', type: 'multi', label: 'Servicios del kiosko', options: SERVICE_OPTIONS },

  { name: 'h6', type: 'heading', label: 'Web' },
  { name: 'featured_title', type: 'text', label: 'Título de la sección de destacados', maxLength: 40, emptyString: true, placeholder: 'Productos del día' },
  { name: 'promo_ticker', type: 'textarea', label: 'Frases de la marquesina', hint: 'Una frase por línea. Se suman a las de las campañas.' },
  { name: 'campaign_stack_mode', type: 'select', label: 'Descuento propio + campaña', noEmpty: true, default: 'max', options: [{ value: 'max', label: 'Aplicar el mayor (recomendado)' }, { value: 'stack', label: 'Acumular los dos' }] },
]
export const datosCheck = (v) => {
  const e = {}
  const phone = cleanPhone(v.whatsapp_number || '')
  if (phone && (phone.length < 10 || phone.length > 15)) e.whatsapp_number = 'Número inválido. Ej. Argentina: 5491112345678'
  if (v.whatsapp_default_message && !v.whatsapp_default_message.includes('{producto}')) e.whatsapp_default_message = 'Incluí {producto} para que aparezca el nombre del producto'
  return e
}
export const datosTransform = (p) => ({
  ...p,
  whatsapp_number: cleanPhone(p.whatsapp_number || ''),
  instagram_username: cleanInstagram(p.instagram_username || ''),
  map_embed_url: extractEmbedSrc(p.map_embed_url || '') || null,
  featured_title: p.featured_title || 'Destacados',
  whatsapp_default_message: p.whatsapp_default_message || 'Hola! Quería consultar por *{producto}*. ¿Está disponible?',
})
