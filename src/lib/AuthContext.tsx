import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'

const SESSION_KEY = 'alimentos_session'
const SESSION_HOURS = 12

interface AuthContextValue {
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (password: string) => Promise<boolean>
  logout: () => void
  changePassword: (oldPwd: string, newPwd: string) => Promise<{ ok: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function hasValidSession(): boolean {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return false
  const expiresAt = Number(raw)
  if (Number.isNaN(expiresAt)) return false
  return Date.now() < expiresAt
}

function setSession() {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000
  localStorage.setItem(SESSION_KEY, String(expiresAt))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsAuthenticated(hasValidSession())
    setLoading(false)
  }, [])

  async function login(password: string): Promise<boolean> {
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('check_site_password', {
      pwd: password,
    })
    if (rpcError) {
      setError('No se pudo verificar la contraseña. Revisá la conexión con Supabase.')
      return false
    }
    if (data === true) {
      setSession()
      setIsAuthenticated(true)
      return true
    }
    setError('Contraseña incorrecta.')
    return false
  }

  function logout() {
    clearSession()
    setIsAuthenticated(false)
  }

  async function changePassword(oldPwd: string, newPwd: string) {
    const { data, error: rpcError } = await supabase.rpc('set_site_password', {
      old_pwd: oldPwd,
      new_pwd: newPwd,
    })
    if (rpcError) {
      return { ok: false, error: 'Error de conexión con Supabase.' }
    }
    if (data === true) {
      return { ok: true }
    }
    return { ok: false, error: 'La contraseña actual no es correcta.' }
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, loading, error, login, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
