import { useEffect, useMemo, useState, useCallback } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'
import { normalize } from '../utils/format'
import { local } from '../utils/safeStorage'
import Hero from '../components/store/Hero'
import ProductGrid, { SkeletonGrid } from '../components/store/ProductGrid'
import ProductModal from '../components/store/ProductModal'
import { CloseIcon, GridIcon, ListIcon, SearchIcon } from '../components/store/Icons'
import s from '../styles/store.module.css'

const byNew = (a, b) => new Date(b.created_at) - new Date(a.created_at)
const SORTS = {
  new: byNew,
  asc: (a, b) => a.final_price - b.final_price || byNew(a, b),
  desc: (a, b) => b.final_price - a.final_price || byNew(a, b),
  az: (a, b) => a.name.localeCompare(b.name, 'es'),
}

export default function Home() {
  const { products, categories, loading, error, reload, campaign } = useOutletContext()
  const { settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') || ''
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('new')
  const [view, setView] = useState(() => (local.get('kiosko-view') === 'list' ? 'list' : 'grid'))
  const [selected, setSelected] = useState(null)
  const closeModal = useCallback(() => setSelected(null), [])

  useEffect(() => {
    document.title = settings.store_name
  }, [settings.store_name])

  const changeView = (v) => {
    setView(v)
    local.set('kiosko-view', v)
  }
  const setCat = (slug) => setParams(slug ? { cat: slug } : {}, { replace: true })

  const hasCombos = useMemo(() => products.some((p) => p.kind === 'combo'), [products])

  const visible = useMemo(() => {
    const q = normalize(query.trim())
    return products
      .filter((p) => (cat === 'combos' ? p.kind === 'combo' : !cat || p.category?.slug === cat))
      .filter(
        (p) =>
          !q ||
          normalize(`${p.name} ${p.presentation || ''} ${p.category?.name || ''} ${p.description || ''}`).includes(q)
      )
      .sort((a, b) => Number(!a.in_stock) - Number(!b.in_stock) || SORTS[sort](a, b)) // agotados al final
  }, [products, cat, query, sort])

  const featured = useMemo(
    () => (cat || query ? [] : products.filter((p) => p.is_featured && p.in_stock).slice(0, 12)),
    [products, cat, query]
  )

  const currentCat = categories.find((c) => c.slug === cat)
  const title = cat === 'combos' ? 'Combos y promos' : currentCat ? currentCat.name : 'Todo el catálogo'
  const banner = campaign?.banner_message || ''

  return (
    <>
      <Hero banner={banner} />

      {/* Barra pegajosa: buscador bien visible + categorías + orden */}
      <div className={s.catalogBar}>
        <div className={`container ${s.catalogBarInner}`}>
          <div className={s.searchWrap}>
            <SearchIcon />
            <label htmlFor="search" className="visually-hidden">Buscar productos</label>
            <input
              id="search"
              type="search"
              className={s.searchInput}
              placeholder="¿Qué estás buscando?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <button className={s.searchClear} onClick={() => setQuery('')} aria-label="Borrar búsqueda">
                <CloseIcon width={18} height={18} />
              </button>
            )}
          </div>

          <nav className={s.chips} aria-label="Categorías">
            <button className={`${s.chip} ${!cat ? s.chipOn : ''}`} onClick={() => setCat('')}>Todo</button>
            {hasCombos && (
              <button className={`${s.chip} ${cat === 'combos' ? s.chipOn : ''}`} onClick={() => setCat('combos')}>
                🎁 Combos
              </button>
            )}
            {categories.map((c) => (
              <button key={c.id} className={`${s.chip} ${cat === c.slug ? s.chipOn : ''}`} onClick={() => setCat(c.slug)}>
                {c.emoji && <span aria-hidden="true">{c.emoji}</span>} {c.name}
                {c.is_adult && <span className={s.chipAdult}>+18</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <section id="productos" className="container" style={{ scrollMarginTop: '8rem' }}>
        {currentCat?.is_adult && (
          <p className={s.adultBanner} role="note">
            🔞 <b>Venta solo a mayores de 18 años.</b> Podemos pedirte DNI al entregar.
          </p>
        )}

        {featured.length > 0 && (
          <div className={s.featured}>
            <h2 className={s.sectionTitle}>{settings.featured_title || 'Destacados'}</h2>
            <ProductGrid products={featured} onOpen={setSelected} animateKey="featured" view="grid" />
          </div>
        )}

        <div className={s.toolbar}>
          <h2 className={s.sectionTitle}>{title}</h2>
          <div className={s.toolbarRight}>
            {!loading && !error && (
              <span className={s.resultCount} aria-live="polite">
                {visible.length} {visible.length === 1 ? 'producto' : 'productos'}
              </span>
            )}
            <label htmlFor="sort" className="visually-hidden">Ordenar</label>
            <select id="sort" className={s.sortSelect} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Más nuevos</option>
              <option value="asc">Precio: menor a mayor</option>
              <option value="desc">Precio: mayor a menor</option>
              <option value="az">A–Z</option>
            </select>
            <div className={s.viewToggle} role="group" aria-label="Vista">
              <button className={view === 'grid' ? s.viewOn : ''} onClick={() => changeView('grid')} aria-label="Vista en grilla" aria-pressed={view === 'grid'}>
                <GridIcon width={18} height={18} />
              </button>
              <button className={view === 'list' ? s.viewOn : ''} onClick={() => changeView('list')} aria-label="Vista en lista compacta" aria-pressed={view === 'list'}>
                <ListIcon width={18} height={18} />
              </button>
            </div>
          </div>
        </div>

        {loading && <SkeletonGrid />}

        {error && !loading && (
          <div className={s.state} role="alert">
            <h3>No pudimos cargar los productos</h3>
            <p>Revisá tu conexión e intentá de nuevo.</p>
            <button className="btn btn-primary" onClick={reload}>Reintentar</button>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className={s.state}>
            <h3>No encontramos nada</h3>
            <p>{query ? 'Probá con otra palabra o limpiá la búsqueda.' : 'Todavía no hay productos acá. ¡Volvé pronto!'}</p>
            {query && <button className="btn btn-ghost" onClick={() => setQuery('')}>Limpiar búsqueda</button>}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <ProductGrid products={visible} onOpen={setSelected} animateKey={`${cat}|${sort}|${query}|${view}`} view={view} />
        )}
      </section>

      <AnimatePresence>
        {selected && <ProductModal key={selected.id} product={selected} onClose={closeModal} />}
      </AnimatePresence>
    </>
  )
}
