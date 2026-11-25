import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/** Sin sesión → redirige al login (/admin). */
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <p style={{ padding: '3rem', textAlign: 'center' }}>Cargando…</p>
  if (!session) return <Navigate to="/admin" replace />
  return children
}
