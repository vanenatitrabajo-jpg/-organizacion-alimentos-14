import { FormEvent, useState } from 'react'
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Configuracion() {
  const { changePassword } = useAuth()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPwd.length < 4) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 4 caracteres.' })
      return
    }
    if (newPwd !== confirmPwd) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' })
      return
    }

    setSubmitting(true)
    const result = await changePassword(oldPwd, newPwd)
    setSubmitting(false)

    if (result.ok) {
      setMessage({ type: 'ok', text: 'Contraseña actualizada correctamente.' })
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } else {
      setMessage({ type: 'error', text: result.error ?? 'No se pudo cambiar la contraseña.' })
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">Configuración</h1>
        <p className="text-ink-500 mt-1">Administrá el acceso y las preferencias del sistema.</p>
      </div>

      <div className="bg-white rounded-xl2 shadow-card p-6 max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-cocina-50 text-cocina-600 flex items-center justify-center">
            <KeyRound size={17} />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink-900">Contraseña de acceso</h2>
            <p className="text-ink-500 text-xs mt-0.5">Es la contraseña única para entrar al sistema.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">Contraseña actual</span>
            <input
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400 focus:border-transparent"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">Nueva contraseña</span>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400 focus:border-transparent"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">Confirmar nueva contraseña</span>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400 focus:border-transparent"
              required
            />
          </label>

          {message && (
            <p
              className={`text-sm flex items-center gap-1.5 ${
                message.type === 'ok' ? 'text-office-600' : 'text-red-600'
              }`}
            >
              {message.type === 'ok' && <CheckCircle2 size={15} />}
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-ink-900 text-white py-2.5 font-medium hover:bg-ink-700 transition-colors disabled:opacity-50 self-start px-5"
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            Guardar contraseña
          </button>
        </form>
      </div>
    </div>
  )
}
