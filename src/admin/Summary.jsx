import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import s from '../styles/admin.module.css'

/** Resumen: cuántos productos hay, cuáles están agotados y cuáles se ven más. */
export default function Summary() {
  const [data, setData] = useState(null)
  const [fail, setFail] = useState(false)

  const load = async () => {
    setFail(false)
    const [p, v, c] = await Promise.all([
      supabase.from('products').select('id, name, kind, in_stock, is_active'),
      supabase.from('product_views').select('views, product:products(name)').order('views', { ascending: false }).limit(5),
      supabase.from('campaigns').select('id, name, is_active'),
    ])
    if (p.error) return setFail(true)
    setData({ products: p.data, top: v.data || [], campaigns: c.data || [] })
  }
  useEffect(() => {
    load()
  }, [])

  if (fail) return <div className={s.emptyState} role="alert"><p>No pudimos cargar el resumen.</p><button className="btn btn-primary" onClick={load}>Reintentar</button></div>
  if (!data) return <ul className={s.list} aria-busy="true">{[0, 1].map((i) => <li key={i} className={`${s.row} ${s.skel}`} />)}</ul>

  const prods = data.products.filter((x) => x.kind === 'product')
  const out = data.products.filter((x) => !x.in_stock)
  const tiles = [
    { n: prods.length, t: 'Productos', to: 'productos' },
    { n: data.products.filter((x) => x.kind === 'combo').length, t: 'Combos', to: 'combos' },
    { n: out.length, t: 'Agotados', to: 'productos', warn: out.length > 0 },
    { n: data.campaigns.filter((x) => x.is_active).length, t: 'Campañas activas', to: 'campanas' },
  ]

  return (
    <div>
      <h1 className={s.h1}>Resumen</h1>
      <div className={s.tiles}>
        {tiles.map((t) => (
          <Link key={t.t} to={`/admin/panel/${t.to}`} className={`${s.tile} ${t.warn ? s.tileWarn : ''}`}>
            <b>{t.n}</b>
            <span>{t.t}</span>
          </Link>
        ))}
      </div>

      <div className={s.card} style={{ marginTop: '1rem' }}>
        <h2 className={s.h2}>Más vistos</h2>
        {data.top.length === 0 ? (
          <p className="hint">Todavía no hay vistas. Se cuentan cuando alguien abre un producto en la web.</p>
        ) : (
          <ol className={s.rank}>
            {data.top.map((r, i) => (
              <li key={i}><span>{r.product?.name || '—'}</span><b>{r.views}</b></li>
            ))}
          </ol>
        )}
      </div>

      <div className={s.card} style={{ marginTop: '1rem' }}>
        <h2 className={s.h2}>Agotados</h2>
        {out.length === 0 ? (
          <p className="hint">No hay productos agotados. 🎉</p>
        ) : (
          <ul className={s.plain}>
            {out.map((x) => <li key={x.id}>{x.name}{!x.is_active && <span className="hint"> (oculto)</span>}</li>)}
          </ul>
        )}
        {out.length > 0 && <Link className="btn btn-ghost btn-sm" to="/admin/panel/productos" style={{ alignSelf: 'flex-start' }}>Ir a productos</Link>}
      </div>
    </div>
  )
}
