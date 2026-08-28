import { NavLink, Outlet } from 'react-router-dom'
import {
  Home,
  Upload,
  CalendarDays,
  CalendarRange,
  Users,
  Shuffle,
  Settings2,
  BarChart3,
  History,
  UtensilsCrossed,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const nav = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/importar', label: 'Importar organización', icon: Upload },
  { to: '/semanal', label: 'Organización semanal', icon: CalendarDays },
  { to: '/mensual', label: 'Organización mensual', icon: CalendarRange },
  { to: '/personal-fijo', label: 'Personal fijo', icon: Users },
  { to: '/personal-variable', label: 'Personal variable', icon: Shuffle },
  { to: '/reglas', label: 'Reglas y configuración', icon: Settings2 },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/historial', label: 'Historial', icon: History },
]

export default function Layout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-base-50">
      <aside className="no-print w-64 shrink-0 bg-white border-r border-base-200 flex flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-base-200">
          <div className="w-9 h-9 rounded-xl bg-cocina-400 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="text-white" size={18} />
          </div>
          <div className="leading-tight">
            <p className="font-display font-semibold text-ink-900 text-sm">Alimentos</p>
            <p className="text-ink-500 text-xs">Organización de personal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cocina-50 text-cocina-600'
                    : 'text-ink-700 hover:bg-base-100'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-base-200 flex flex-col gap-1">
          <NavLink
            to="/configuracion"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-cocina-50 text-cocina-600' : 'text-ink-700 hover:bg-base-100'
              }`
            }
          >
            <Settings2 size={17} />
            Configuración
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-500 hover:bg-base-100 transition-colors"
          >
            <LogOut size={17} />
            Salir
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
