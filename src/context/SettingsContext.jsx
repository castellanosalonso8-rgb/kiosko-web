import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatMoney } from '../utils/format'

export const DEFAULTS = {
  store_name: 'Mi Kiosko',
  tagline: '',
  logo_url: '',
  currency: 'ARS',
  whatsapp_number: '',
  whatsapp_default_message: '',
  instagram_username: '',
  address: '',
  map_embed_url: '',
  map_coords: '',
  active_theme: 'normal',
  campaign_stack_mode: 'max',
  featured_title: 'Destacados',
  promo_ticker: '',
  orders_enabled: true,
  min_order: 0,
  delivery_enabled: true,
  delivery_fee: 0,
  delivery_zone: '',
  payment_methods: ['efectivo', 'transferencia', 'mercadopago'],
  services: [],
  notice_enabled: false,
  notice_text: '',
  notice_type: 'info',
  notice_starts_on: null,
  notice_ends_on: null,
}

const SettingsContext = createContext({ settings: DEFAULTS, loading: true, reload: () => {} })

/** Lee la fila única de store_settings (datos del kiosko, tema activo, aviso, envío…) */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle()
    if (data) {
      // null de la base → valor por defecto (así los componentes no se rompen)
      const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null))
      setSettings({ ...DEFAULTS, ...clean, notice_starts_on: data.notice_starts_on, notice_ends_on: data.notice_ends_on })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const value = useMemo(() => ({ settings, loading, reload }), [settings, loading, reload])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)

/** Formateador de plata según la moneda configurada. */
export function useMoney() {
  const { settings } = useSettings()
  return useCallback((n) => formatMoney(n, settings.currency), [settings.currency])
}
