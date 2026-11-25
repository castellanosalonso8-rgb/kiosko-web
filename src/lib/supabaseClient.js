import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si faltan las variables, la app muestra un aviso en vez de romperse.
export const isConfigured = Boolean(url && key && !url.includes('TU-PROYECTO'))

export const supabase = createClient(
  isConfigured ? url : 'https://placeholder.supabase.co',
  isConfigured ? key : 'placeholder-key'
)

export const BUCKET = 'product-images'
