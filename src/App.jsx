import { Suspense, lazy } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { isConfigured } from './lib/supabaseClient'
import StoreLayout from './components/store/StoreLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'
import Home from './pages/Home'
import Contact from './pages/Contact'
// El panel se carga aparte: la web pública no descarga el código del admin
const Login = lazy(() => import('./pages/admin/Login'))
const Panel = lazy(() => import('./pages/admin/Panel'))

function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
      <h1>Página no encontrada</h1>
      <p className="hint" style={{ margin: '1rem 0 1.5rem' }}>
        El enlace que buscás no existe.
      </p>
      <Link to="/" className="btn btn-primary">
        Volver al kiosko
      </Link>
    </div>
  )
}

function MissingConfig() {
  return (
    <div className="container" style={{ padding: '4rem 0', maxWidth: 640 }}>
      <h1>Falta configurar Supabase</h1>
      <p style={{ margin: '1rem 0' }}>
        Creá un archivo <code>.env</code> (copiando <code>.env.example</code>) con{' '}
        <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>, y reiniciá{' '}
        <code>npm run dev</code>. En Vercel/Netlify cargalas como variables de entorno y redeployá.
      </p>
    </div>
  )
}

export default function App() {
  if (!isConfigured) return <MissingConfig />

  return (
    <Suspense fallback={<p style={{ padding: '3rem', textAlign: 'center' }}>Cargando…</p>}>
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/contacto" element={<Contact />} />
      </Route>

      {/* Demo de temas: cambia el tema en vivo SIN guardar */}
      <Route path="/demo" element={<StoreLayout demo />}>
        <Route index element={<Home />} />
      </Route>

      {/* Ruta oculta: no hay ningún enlace a /admin desde la tienda */}
      <Route path="/admin" element={<Login />} />
      <Route
        path="/admin/panel/:section?"
        element={
          <ProtectedRoute>
            <Panel />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  )
}
