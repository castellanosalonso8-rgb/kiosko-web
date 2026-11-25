import { useEffect } from 'react'
import s from '../../styles/admin.module.css'

export default function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', busy, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className={s.overlay} onClick={onCancel}>
      <div
        className={s.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" style={{ fontSize: '1.3rem' }}>
          {title}
        </h2>
        <p className="hint" style={{ fontSize: '0.95rem' }}>
          {message}
        </p>
        <div className={s.formActions}>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Eliminando…' : confirmLabel}
          </button>
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy} autoFocus>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
