import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Catálogo público. Los precios finales vienen YA calculados desde la vista
 * `catalog_products` (descuento propio + campañas): el frontend no recalcula nada.
 */
export function useCatalog() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [prod, cats, camps] = await Promise.all([
      supabase
        .from('catalog_products')
        .select('*')
        .eq('is_active', true)
        .eq('category_hidden', false)
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('is_hidden', false).order('sort_order').order('name'),
      supabase.from('campaigns').select('id, name, theme_id, banner_message, discount_percent').eq('is_active', true),
    ])
    if (prod.error || cats.error) {
      setError(prod.error || cats.error)
    } else {
      setProducts(
        prod.data.map((p) => ({
          ...p,
          category: p.category_id
            ? { id: p.category_id, name: p.category_name, slug: p.category_slug, is_adult: p.category_is_adult }
            : null,
        }))
      )
      setCategories(cats.data)
      setCampaigns(camps.data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { products, categories, campaigns, loading, error, reload: load }
}
