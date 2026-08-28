import { FormEvent, useEffect, useState } from 'react'
import { Users, Plus, Trash2, Pencil, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Persona, Sector, SECTOR_LABEL } from '../lib/types'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const SECTOR_TINT: Record<Sector, string> = {
  cocina: 'bg-cocina-50 text-cocina-600',
  office: 'bg-office-50 text-office-600',
  menu: 'bg-menu-50 text-menu-600',
}

const vacio = {
  nombre: '',
  sector: 'cocina' as Sector,
  puesto: '',
  horario_habitual: '',
  dias_habituales: [] as string[],
  observaciones: '',
}

export default function PersonalFijo() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState(vacio)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    setLoading(true)
    const { data, error } = await supabase.from('personas').select('*').order('nombre')
    if (!error && data) setPersonas(data as Persona[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  function nuevoRegistro() {
    setForm(vacio)
    setEditando(null)
    setMostrarForm(true)
  }

  function editar(p: Persona) {
    setForm({
      nombre: p.nombre,
      sector: p.sector,
      puesto: p.puesto ?? '',
      horario_habitual: p.horario_habitual ?? '',
      dias_habituales: p.dias_habituales ?? [],
      observaciones: p.observaciones ?? '',
    })
    setEditando(p.id)
    setMostrarForm(true)
  }

  function toggleDia(dia: string) {
    setForm((f) => ({
      ...f,
      dias_habituales: f.dias_habituales.includes(dia)
        ? f.dias_habituales.filter((d) => d !== dia)
        : [...f.dias_habituales, dia],
    }))
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setGuardando(true)
    setError(null)

    const payload = {
      nombre: form.nombre.trim(),
      sector: form.sector,
      puesto: form.puesto.trim() || null,
      horario_habitual: form.horario_habitual.trim() || null,
      dias_habituales: form.dias_habituales.length ? form.dias_habituales : null,
      observaciones: form.observaciones.trim() || null,
    }

    const { error } = editando
      ? await supabase.from('personas').update(payload).eq('id', editando)
      : await supabase.from('personas').insert(payload)

    setGuardando(false)
    if (error) {
      setError('No se pudo guardar. Revisá la conexión con Supabase.')
      return
    }
    setMostrarForm(false)
    cargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta persona de Personal fijo?')) return
    await supabase.from('personas').delete().eq('id', id)
    cargar()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Personal fijo</h1>
          <p className="text-ink-500 mt-1">
            Personas con sector, horario y días habituales. Se usan para asignar automáticamente
            el sector cuando alguien aparece en Alimentos en el Excel importado.
          </p>
        </div>
        <button
          onClick={nuevoRegistro}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors"
        >
          <Plus size={16} />
          Agregar persona
        </button>
      </div>

      {mostrarForm && (
        <form
          onSubmit={guardar}
          className="bg-white rounded-xl2 shadow-card p-6 mb-6 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">
              {editando ? 'Editar persona' : 'Nueva persona'}
            </h2>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-ink-500 hover:text-ink-900">
              <X size={18} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Nombre</span>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Sector habitual</span>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value as Sector })}
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              >
                <option value="cocina">Cocina</option>
                <option value="office">Office</option>
                <option value="menu">Menú</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Puesto (opcional)</span>
              <input
                value={form.puesto}
                onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                placeholder="Ej: Cocina 3"
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-700">Horario habitual (opcional)</span>
              <input
                value={form.horario_habitual}
                onChange={(e) => setForm({ ...form, horario_habitual: e.target.value })}
                placeholder="Ej: 08:25-16:00"
                className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              />
            </label>
          </div>

          <div>
            <span className="text-sm font-medium text-ink-700 block mb-1.5">Días habituales</span>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((dia) => (
                <button
                  type="button"
                  key={dia}
                  onClick={() => toggleDia(dia)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.dias_habituales.includes(dia)
                      ? 'bg-cocina-400 text-white border-cocina-400'
                      : 'bg-base-50 text-ink-700 border-base-300'
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">Observaciones (opcional)</span>
            <textarea
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              rows={2}
              className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
            />
          </label>

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
      ) : personas.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-soft p-10 text-center flex flex-col items-center">
          <Users className="text-ink-500 mb-3" size={22} />
          <p className="text-ink-700 font-medium text-sm">Todavía no cargaste a nadie</p>
          <p className="text-ink-500 text-sm mt-1">Agregá tu primera persona para empezar a cruzar datos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-soft divide-y divide-base-200 overflow-hidden">
          {personas.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${SECTOR_TINT[p.sector]}`}>
                {SECTOR_LABEL[p.sector]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 text-sm truncate">{p.nombre}</p>
                <p className="text-ink-500 text-xs truncate">
                  {[p.puesto, p.horario_habitual, p.dias_habituales?.join(', ')].filter(Boolean).join(' · ') ||
                    'Sin datos adicionales'}
                </p>
              </div>
              <button onClick={() => editar(p)} className="text-ink-500 hover:text-ink-900 shrink-0">
                <Pencil size={16} />
              </button>
              <button onClick={() => eliminar(p.id)} className="text-ink-500 hover:text-red-600 shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
