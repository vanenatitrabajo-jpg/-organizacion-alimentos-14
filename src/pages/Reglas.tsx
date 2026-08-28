import { FormEvent, useEffect, useState } from 'react'
import { Settings2, Plus, Trash2, X, Loader2, Power } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Regla, Sector, SECTOR_LABEL } from '../lib/types'

const SECTOR_TINT: Record<Sector, string> = {
  cocina: 'bg-cocina-50 text-cocina-600',
  office: 'bg-office-50 text-office-600',
  menu: 'bg-menu-50 text-menu-600',
}

export default function Reglas() {
  const [reglas, setReglas] = useState<Regla[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [prioridad, setPrioridad] = useState(0)
  const [horaDesde, setHoraDesde] = useState('')
  const [horaHasta, setHoraHasta] = useState('')
  const [sector, setSector] = useState<Sector>('office')

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('reglas').select('*').order('prioridad', { ascending: false })
    if (data) setReglas(data as Regla[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function sembrarReglasDeEjemplo() {
    await supabase.from('reglas').insert([
      { nombre: 'Office almuerzo', prioridad: 10, hora_desde: '12:50', hora_hasta: '14:30', sector: 'office', activa: true },
      { nombre: 'Office cena', prioridad: 10, hora_desde: '20:15', hora_hasta: '21:35', sector: 'office', activa: true },
    ])
    cargar()
  }

  function abrirForm() {
    setNombre('')
    setPrioridad(0)
    setHoraDesde('')
    setHoraHasta('')
    setSector('office')
    setMostrarForm(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !horaDesde || !horaHasta) return
    setGuardando(true)
    setError(null)

    const { error } = await supabase.from('reglas').insert({
      nombre: nombre.trim(),
      prioridad,
      hora_desde: horaDesde,
      hora_hasta: horaHasta,
      sector,
      activa: true,
    })

    setGuardando(false)
    if (error) {
      setError('No se pudo guardar. Revisá la conexión con Supabase.')
      return
    }
    setMostrarForm(false)
    cargar()
  }

  async function toggleActiva(r: Regla) {
    await supabase.from('reglas').update({ activa: !r.activa }).eq('id', r.id)
    cargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return
    await supabase.from('reglas').delete().eq('id', id)
    cargar()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Reglas y configuración</h1>
          <p className="text-ink-500 mt-1">
            Reglas por horario (ej: 12:50 a 14:30 → Office). Se aplican por prioridad, y ceden ante
            una excepción de Personal variable para ese día.
          </p>
        </div>
        <button
          onClick={abrirForm}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors"
        >
          <Plus size={16} />
          Agregar regla
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={guardar} className="bg-white rounded-xl2 shadow-card p-6 mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Nueva regla</h2>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-ink-500 hover:text-ink-900">
              <X size={18} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-ink-700">Nombre de la regla</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Office almuerzo"
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Desde</span>
              <input
                type="time"
                value={horaDesde}
                onChange={(e) => setHoraDesde(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Hasta</span>
              <input
                type="time"
                value={horaHasta}
                onChange={(e) => setHoraHasta(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Sector</span>
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
              <span className="text-sm font-medium text-ink-700">Prioridad</span>
              <input
                type="number"
                value={prioridad}
                onChange={(e) => setPrioridad(Number(e.target.value))}
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
      ) : reglas.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-soft p-10 text-center flex flex-col items-center">
          <Settings2 className="text-ink-500 mb-3" size={22} />
          <p className="text-ink-700 font-medium text-sm">No hay reglas cargadas</p>
          <p className="text-ink-500 text-sm mt-1 mb-4">
            Podés empezar con las dos reglas típicas de Office (almuerzo y cena) y ajustarlas después.
          </p>
          <button
            onClick={sembrarReglasDeEjemplo}
            className="text-sm font-medium text-cocina-600 bg-cocina-50 px-4 py-2 rounded-lg hover:bg-cocina-100 transition-colors"
          >
            Cargar reglas de ejemplo
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-soft divide-y divide-base-200 overflow-hidden">
          {reglas.map((r) => (
            <div key={r.id} className={`flex items-center gap-4 px-5 py-3.5 ${!r.activa ? 'opacity-50' : ''}`}>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${SECTOR_TINT[r.sector ?? 'cocina']}`}>
                {SECTOR_LABEL[r.sector ?? 'cocina']}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 text-sm truncate">{r.nombre}</p>
                <p className="text-ink-500 text-xs truncate">
                  {r.hora_desde}–{r.hora_hasta} · prioridad {r.prioridad}
                </p>
              </div>
              <button onClick={() => toggleActiva(r)} className="text-ink-500 hover:text-ink-900 shrink-0" title={r.activa ? 'Desactivar' : 'Activar'}>
                <Power size={16} />
              </button>
              <button onClick={() => eliminar(r.id)} className="text-ink-500 hover:text-red-600 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
