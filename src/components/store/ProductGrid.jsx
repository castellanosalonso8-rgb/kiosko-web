import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import s from '../../styles/store.module.css'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }

/** `animateKey` cambia con cada filtro/orden/búsqueda → las tarjetas vuelven a hacer "pop". */
export default function ProductGrid({ products, onOpen, animateKey, view = 'grid' }) {
  return (
    <motion.ul
      key={animateKey}
      className={view === 'list' ? s.list : s.grid}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onOpen={onOpen} variant={view} />
      ))}
    </motion.ul>
  )
}

export function SkeletonGrid({ count = 10 }) {
  return (
    <div className={s.grid} aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={s.skeleton}>
          <div className={s.skelImg} />
          <div className={s.skelLine} />
          <div className={s.skelLine} style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  )
}
