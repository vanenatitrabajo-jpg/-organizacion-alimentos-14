import { FormEvent, useEffect, useState } from 'react'
import { Shuffle, Plus, Trash2, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AsignacionVariable, Persona, Sector, SECTOR_LABEL } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'

const SECTOR_TINT: Record<Sector, string> = {
  cocina: 'bg-cocina-50 text-cocina-600',
  office: 'bg-office-50 text-office-600',
  menu: 'bg-menu-50 text-menu-600',
}

export default function PersonalVariable() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionVariable[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [personaId, setPersonaId] = useState('')
  const [dia, setDia] = useState('')
  const [sector, setSector] = useState<Sector>('cocina')
  const [horario, setHorario] = useState('')

  async function cargar() {
    setLoading(true)
    const [p, a] = await Promise.all([
      supabase.from('personas').select('*').order('nombre'),
      supabase.from('asignaciones_variables').select('*').order('dia', { ascending: false }),
    ])
    if (p.data) setPersonas(p.data as Persona[])
    if (a.data) setAsignaciones(a.data as AsignacionVariable[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  function abrirForm() {
    setPersonaId(personas[0]?.id ?? '')
    setDia('')
    setSector('cocina')
    setHorario('')
    setMostrarForm(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!personaId || !dia) return
    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('asignaciones_variables').insert({
      persona_id: personaId,
      dia,
      sector,
      horario: horario.trim() || null,
    })

    setGuardando(false)
    if (error) {
      setError('No se pudo guardar. Revisá la conexión con Supabase.')
      return
    }
    setMostrarForm(false)
    cargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta excepción?')) return
    await supabase.from('asignaciones_variables').delete().eq('id', id)
    cargar()
  }

  function nombreDe(personaId: string) {
    return personas.find((p) => p.id === personaId)?.nombre ?? '(persona eliminada)'
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Personal variable</h1>
          <p className="text-ink-500 mt-1">
            Excepciones puntuales: un día en que una persona va a un sector distinto al habitual.
            Tienen prioridad sobre el sector fijo y sobre las reglas horarias.
          </p>
        </div>
        <button
          onClick={abrirForm}
          disabled={personas.length === 0}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors disabled:opacity-40"
        >
          <Plus size={16} />
          Agregar excepción
        </button>
      </div>

      {personas.length === 0 && (
        <p className="text-ink-500 text-sm mb-4">
          Primero cargá a alguien en Personal fijo para poder registrar una excepción.
        </p>
      )}

      {mostrarForm && (
        <form onSubmit={guardar} className="bg-white rounded-xl2 shadow-card p-6 mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Nueva excepción</h2>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-ink-500 hover:text-ink-900">
              <X size={18} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Persona</span>
              <select
                value={personaId}
                onChange={(e) => setPersonaId(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Día</span>
              <input
                type="date"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Sector ese día</span>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as Sector)}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              >
                <option value="cocina">Cocina</option>
                <option value="office">Office</option>
                <option value="menu">Menú</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Horario (opcional)</span>
              <input
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                placeholder="Ej: 12:50-14:30"
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors disabled:opacity-50"
            >
              {guardando && <Loader2 className="animate-spin" size={15} />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-ink-500 text-sm">Cargando…</p>
      ) : asignaciones.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-soft p-10 text-center flex flex-col items-center">
          <Shuffle className="text-ink-500 mb-3" size={22} />
          <p className="text-ink-700 font-medium text-sm">No hay excepciones cargadas</p>
          <p className="text-ink-500 text-sm mt-1">Se van a usar automáticamente al generar una organización.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-soft divide-y divide-base-200 overflow-hidden">
          {asignaciones.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${SECTOR_TINT[a.sector ?? 'cocina']}`}>
                {SECTOR_LABEL[a.sector ?? 'cocina']}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 text-sm truncate">{nombreDe(a.persona_id)}</p>
                <p className="text-ink-500 text-xs truncate">
                  {formatFechaLarga(a.dia)}
                  {a.horario ? ` · ${a.horario}` : ''}
                </p>
              </div>
              <button onClick={() => eliminar(a.id)} className="text-ink-500 hover:text-red-600 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
