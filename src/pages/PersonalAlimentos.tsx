import { FormEvent, useEffect, useState } from 'react'
import { Users, Plus, Trash2, Pencil, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Persona, Puesto, GRUPO_LABEL, GRUPO_ORDEN, Grupo } from '../lib/types'

const vacio = {
  nombre: '',
  puesto_principal_id: '',
  puesto_segunda_id: '',
  puesto_tercera_id: '',
  es_fijo: true,
  observaciones: '',
}

export default function PersonalAlimentos() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState(vacio)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    setLoading(true)
    const [p, q] = await Promise.all([
      supabase.from('personas').select('*').order('nombre'),
      supabase.from('puestos').select('*').eq('activo', true).order('grupo').order('sort_order'),
    ])
    if (p.data) setPersonas(p.data as Persona[])
    if (q.data) setPuestos(q.data as Puesto[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  function nombrePuesto(id: string | null) {
    if (!id) return '—'
    const puesto = puestos.find((x) => x.id === id)
    return puesto ? `${puesto.nombre} (${GRUPO_LABEL[puesto.grupo]})` : '—'
  }

  function nuevoRegistro() {
    setForm(vacio)
    setEditando(null)
    setMostrarForm(true)
  }

  function editar(p: Persona) {
    setForm({
      nombre: p.nombre,
      puesto_principal_id: p.puesto_principal_id ?? '',
      puesto_segunda_id: p.puesto_segunda_id ?? '',
      puesto_tercera_id: p.puesto_tercera_id ?? '',
      es_fijo: p.es_fijo ?? true,
      observaciones: p.observaciones ?? '',
    })
    setEditando(p.id)
    setMostrarForm(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setGuardando(true)
    setError(null)

    const payload = {
      nombre: form.nombre.trim(),
      puesto_principal_id: form.puesto_principal_id || null,
      puesto_segunda_id: form.puesto_segunda_id || null,
      puesto_tercera_id: form.puesto_tercera_id || null,
      es_fijo: form.es_fijo,
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
    if (!confirm('¿Eliminar esta persona?')) return
    await supabase.from('personas').delete().eq('id', id)
    cargar()
  }

  const puestosPorGrupo = GRUPO_ORDEN.map((g) => ({ grupo: g, lista: puestos.filter((p) => p.grupo === g) }))

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Personal de Alimentos</h1>
          <p className="text-ink-500 mt-1">
            Cada persona con su puesto principal y las preferencias de respaldo. Al generar la
            organización, si el puesto principal está ocupado se prueba la segunda preferencia y
            después la tercera.
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
        <form onSubmit={guardar} className="bg-white rounded-xl2 shadow-card p-6 mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">{editando ? 'Editar persona' : 'Nueva persona'}</h2>
            <button type="button" onClick={() => setMostrarForm(false)} className="text-ink-500 hover:text-ink-900">
              <X size={18} />
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-700">Nombre</span>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
              required
            />
          </label>

          <div className="grid sm:grid-cols-3 gap-4">
            <SelectPuesto
              label="Puesto principal"
              value={form.puesto_principal_id}
              onChange={(v) => setForm({ ...form, puesto_principal_id: v })}
              puestosPorGrupo={puestosPorGrupo}
            />
            <SelectPuesto
              label="Segunda preferencia"
              value={form.puesto_segunda_id}
              onChange={(v) => setForm({ ...form, puesto_segunda_id: v })}
              puestosPorGrupo={puestosPorGrupo}
            />
            <SelectPuesto
              label="Tercera preferencia"
              value={form.puesto_tercera_id}
              onChange={(v) => setForm({ ...form, puesto_tercera_id: v })}
              puestosPorGrupo={puestosPorGrupo}
            />
          </div>

          <div>
            <span className="text-sm font-medium text-ink-700 block mb-1.5">¿Es personal fijo?</span>
            <div className="flex gap-2">
              {[
                { v: true, l: 'Sí' },
                { v: false, l: 'No' },
              ].map((op) => (
                <button
                  type="button"
                  key={String(op.v)}
                  onClick={() => setForm({ ...form, es_fijo: op.v })}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.es_fijo === op.v
                      ? 'bg-cocina-400 text-white border-cocina-400'
                      : 'bg-base-50 text-ink-700 border-base-300'
                  }`}
                >
                  {op.l}
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
          <p className="text-ink-500 text-sm mt-1">Agregá tu primera persona para empezar a generar organizaciones.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-soft divide-y divide-base-200 overflow-hidden">
          {personas.map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
              <span
                className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                  p.es_fijo ? 'bg-cocina-50 text-cocina-600' : 'bg-base-100 text-ink-500'
                }`}
              >
                {p.es_fijo ? 'Fijo' : 'No fijo'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 text-sm truncate">{p.nombre}</p>
                <p className="text-ink-500 text-xs truncate">
                  1º {nombrePuesto(p.puesto_principal_id)} · 2º {nombrePuesto(p.puesto_segunda_id)} · 3º{' '}
                  {nombrePuesto(p.puesto_tercera_id)}
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

function SelectPuesto({
  label,
  value,
  onChange,
  puestosPorGrupo,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  puestosPorGrupo: { grupo: Grupo; lista: Puesto[] }[]
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 rounded-lg border border-base-300 bg-base-50 focus:outline-none focus:ring-2 focus:ring-cocina-400"
      >
        <option value="">— Sin definir —</option>
        {puestosPorGrupo.map(({ grupo, lista }) => (
          <optgroup key={grupo} label={GRUPO_LABEL[grupo]}>
            {lista.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
