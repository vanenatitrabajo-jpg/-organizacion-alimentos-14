import { FormEvent, useState } from 'react'
import { UtensilsCrossed, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login, error } = useAuth()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError(null)
    setSubmitting(true)
    const ok = await login(password)
    setSubmitting(false)
    if (!ok) setPassword('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cocina-400 flex items-center justify-center shadow-soft mb-4">
            <UtensilsCrossed className="text-white" size={26} />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink-900 text-center">
            Organización de Alimentos
          </h1>
          <p className="text-ink-500 text-sm mt-1 text-center">Ingresá la contraseña para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl2 shadow-card p-6 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">Contraseña</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={18} />
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400 focus:border-transparent text-ink-900"
                placeholder="••••"
              />
            </div>
          </label>

          {(error || localError) && (
            <p className="text-sm text-red-600 -mt-1">{error ?? localError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink-900 text-white py-2.5 font-medium hover:bg-ink-700 transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
