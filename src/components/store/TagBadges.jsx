import { tagLabel } from '../../config/options'
import s from '../../styles/store.module.css'

/** Etiquetas del producto (Nuevo, Más vendido), combo y +18. */
export default function TagBadges({ product }) {
  const items = []
  if (product.kind === 'combo') items.push({ k: 'combo', text: 'Combo', cls: s.tagCombo })
  for (const t of product.tags || []) items.push({ k: t, text: tagLabel(t), cls: t === 'nuevo' ? s.tagNew : s.tagHot })
  if (product.category?.is_adult) items.push({ k: 'adult', text: '+18', cls: s.tagAdult })
  if (!items.length) return null
  return (
    <div className={s.tags}>
      {items.map((i) => (
        <span key={i.k} className={`${s.tag} ${i.cls}`}>
          {i.text}
        </span>
      ))}
    </div>
  )
}
