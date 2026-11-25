import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettings } from '../../context/SettingsContext'
import { nowInBA } from '../../lib/hours'
import { session } from '../../utils/safeStorage'
import { CloseIcon } from './Icons'
import s from '../../styles/store.module.css'

/** Aviso opcional (banner superior). Se cierra con la X durante la sesión. */
export default function Notice() {
  const { settings: st } = useSettings()
  const key = `notice-closed:${st.notice_text}`
  const [, force] = useState(0)
  const closed = session.get(key) === '1'

  const today = nowInBA().dateStr
  const inWindow =
    (!st.notice_starts_on || st.notice_starts_on <= today) && (!st.notice_ends_on || st.notice_ends_on >= today)
  const show = st.notice_enabled && st.notice_text?.trim() && inWindow && !closed

  const close = () => {
    session.set(key, '1')
    force((n) => n + 1)
  }
  const strong = st.notice_type !== 'info'
  const icon = st.notice_type === 'cierre' ? '⛔' : st.notice_type === 'importante' ? '⚠️' : 'ℹ️'

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          className={`${s.notice} ${strong ? s.noticeStrong : ''} ${st.notice_type === 'cierre' ? s.noticeClose : ''}`}
          role={strong ? 'alert' : 'status'}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <div className={`container ${s.noticeInner}`}>
            <span aria-hidden="true">{icon}</span>
            <p>{st.notice_text}</p>
            <button className={s.noticeX} onClick={close} aria-label="Cerrar aviso">
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
