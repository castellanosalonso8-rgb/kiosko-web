import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { addDays, computeStatus, nowInBA } from '../lib/hours'

const HoursContext = createContext({ hours: [], specials: [], status: null, loading: true, reload: () => {} })

/** Horarios semanales + días especiales. El estado "Abierto ahora" se recalcula cada 30 s. */
export function HoursProvider({ children }) {
  const [hours, setHours] = useState([])
  const [specials, setSpecials] = useState([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const reload = useCallback(async () => {
    const from = addDays(nowInBA().dateStr, -1)
    const [h, sp] = await Promise.all([
      supabase.from('business_hours').select('*').order('weekday'),
      supabase.from('special_days').select('*').gte('day', from).order('day'),
    ])
    if (h.data) setHours(h.data)
    if (sp.data) setSpecials(sp.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const status = useMemo(() => computeStatus(hours, specials), [hours, specials, tick])
  const value = useMemo(() => ({ hours, specials, status, loading, reload }), [hours, specials, status, loading, reload])
  return <HoursContext.Provider value={value}>{children}</HoursContext.Provider>
}

export const useHours = () => useContext(HoursContext)
