import { motion } from 'framer-motion'
import { useSettings } from '../../context/SettingsContext'
import { GENERIC_MESSAGE, whatsappUrl } from '../../utils/format'
import { WhatsAppIcon } from './Icons'
import s from '../../styles/store.module.css'

/** Botón flotante de WhatsApp con mensaje genérico. */
export default function WhatsAppFab() {
  const { settings } = useSettings()
  const link = whatsappUrl(settings.whatsapp_number, GENERIC_MESSAGE)
  if (!link) return null

  return (
    <motion.a
      className={s.fab}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      initial={{ opacity: 0, scale: 0.4, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.9, type: 'spring', damping: 14, stiffness: 220 }}
    >
      <WhatsAppIcon />
    </motion.a>
  )
}
