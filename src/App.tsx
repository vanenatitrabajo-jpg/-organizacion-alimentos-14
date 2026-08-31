import { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Inicio from './pages/Inicio'
import Importar from './pages/Importar'
import Semanal from './pages/Semanal'
import Mensual from './pages/Mensual'
import PersonalAlimentos from './pages/PersonalAlimentos'
import Puestos from './pages/Puestos'
import Reportes from './pages/Reportes'
import Historial from './pages/Historial'
import Configuracion from './pages/Configuracion'

function Gate({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-500">Cargando…</div>
  }
  if (!isAuthenticated) {
    return <Login />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Inicio />} />
              <Route path="importar" element={<Importar />} />
              <Route path="semanal" element={<Semanal />} />
              <Route path="mensual" element={<Mensual />} />
              <Route path="personal-alimentos" element={<PersonalAlimentos />} />
              <Route path="puestos" element={<Puestos />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="historial" element={<Historial />} />
              <Route path="configuracion" element={<Configuracion />} />
              {/* Rutas viejas — redirigen a las nuevas para no romper links guardados */}
              <Route path="personal-fijo" element={<Navigate to="/personal-alimentos" replace />} />
              <Route path="personal-variable" element={<Navigate to="/personal-alimentos" replace />} />
              <Route path="reglas" element={<Navigate to="/puestos" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Gate>
      </AuthProvider>
    </BrowserRouter>
  )
}
