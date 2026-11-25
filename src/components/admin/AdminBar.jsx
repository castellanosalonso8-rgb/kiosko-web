import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useNoIndex } from '../../hooks/useNoIndex'
import s from '../../styles/admin.module.css'

export default function AdminBar({ back }) {
  const { signOut } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  useNoIndex()

  const logout = async () => {
    await signOut()
    navigate('/admin', { replace: true })
  }

  return (
    <div className={s.bar}>
      <div className={`container ${s.barInner}`}>
        <span className={s.barTitle}>Panel · {settings.store_name}</span>
        <div className={s.barActions}>
          {back ? (
            <Link to={back} className="btn btn-ghost btn-sm">
              ← Volver
            </Link>
          ) : (
            <Link to="/" className="btn btn-ghost btn-sm" target="_blank">
              Ver kiosko
            </Link>
          )}
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Salir
          </button>
        </div>
      </div>
    </div>
  )
}
