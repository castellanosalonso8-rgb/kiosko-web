import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSettings } from '../context/SettingsContext'
import LocationSection from '../components/store/LocationSection'

/** /contacto: ubicación + horarios + contacto + fotos (todo en una sección). */
export default function Contact() {
  const { settings } = useSettings()
  useEffect(() => {
    document.title = `Dónde estamos · ${settings.store_name}`
  }, [settings.store_name])
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <LocationSection />
    </motion.div>
  )
}
