import { MouseEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatFechaLarga } from '../lib/dateUtils'

interface Fila {
  id: string
  tipo: string
  fecha_inicio: string
  fecha_fin: string
  archivo_origen: string | null
  created_at: string
}

export default function Historial() {
  const [filas, setFilas] = useState<Fila[]>([])
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('organizaciones')
      .select('id, tipo, fecha_inicio, fecha_fin, archivo_origen, created_at')
      .order('created_at', { ascending: false })
    if (data) setFilas(data as Fila[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function eliminar(id: string, e: MouseEvent) {
    e.preventDefault()
    if (!confirm('¿Eliminar esta organización del historial?')) return
    await supabase.from('organizaciones').delete().eq('id', id)
    cargar()
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">Historial</h1>
        <p className="text-ink-500 mt-1">Organizaciones generadas anteriormente. Hacé clic para volver a abrirlas.</p>
      </div>

      {loading ? (
        <p className="text-ink-500 text-sm">Cargando…</p>
      ) : filas.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-soft p-10 text-center flex flex-col items-center">
          <History className="text-ink-500 mb-3" size={22} />
          <p className="text-ink-700 font-medium text-sm">Todavía no hay organizaciones guardadas</p>
          <p className="text-ink-500 text-sm mt-1">
            Se guardan automáticamente cuando confirmás una importación con "Generar y guardar en Historial".
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-soft divide-y divide-base-200 overflow-hidden">
          {filas.map((f) => (
            <Link
              key={f.id}
              to={`/semanal?id=${f.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-base-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 text-sm">
                  Semana del {formatFechaLarga(f.fecha_inicio)} al {formatFechaLarga(f.fecha_fin)}
                </p>
                <p className="text-ink-500 text-xs mt-0.5 truncate">
                  {f.archivo_origen ?? 'Sin archivo'} · generado el{' '}
                  {new Date(f.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
              <button onClick={(e) => eliminar(f.id, e)} className="text-ink-500 hover:text-red-600 shrink-0">
                <Trash2 size={16} />
              </button>
              <ChevronRight size={16} className="text-ink-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
