import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SECTIONS } from '../../admin/sections'
import AdminBar from '../../components/admin/AdminBar'
import Confetti from '../../components/store/Confetti'
import s from '../../styles/admin.module.css'

/** /admin/panel/:section — barra de secciones + la sección elegida. */
export default function Panel() {
  const { section = 'resumen' } = useParams()
  const [confettiKey, setConfettiKey] = useState(0)
  const current = SECTIONS.find((x) => x.key === section)

  useEffect(() => {
    const fire = () => setConfettiKey((n) => n + 1)
    window.addEventListener('kiosko:confetti', fire)
    return () => window.removeEventListener('kiosko:confetti', fire)
  }, [])

  if (!current) return <Navigate to="/admin/panel" replace />

  return (
    <div className={s.page}>
      <AdminBar />
      <div className={`container ${s.content}`}>
        <nav className={s.tabs} aria-label="Secciones del panel">
          {SECTIONS.map((x) => (
            <Link key={x.key} to={`/admin/panel/${x.key}`} className={`${s.tab} ${x.key === section ? s.tabActive : ''}`} aria-current={x.key === section ? 'page' : undefined}>
              <span aria-hidden="true">{x.icon}</span> {x.label}
            </Link>
          ))}
        </nav>
        <div key={current.key}>{current.render()}</div>
      </div>
      <Confetti fireKey={confettiKey} />
    </div>
  )
}
