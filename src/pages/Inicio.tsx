import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Sparkles, Users, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatFechaLarga } from '../lib/dateUtils'
import { OrganizacionGenerada } from '../lib/types'

interface UltimaOrg {
  id: string
  fecha_inicio: string
  fecha_fin: string
  archivo_origen: string | null
  datos: OrganizacionGenerada
}

export default function Inicio() {
  const [personasCount, setPersonasCount] = useState<number | null>(null)
  const [ultima, setUltima] = useState<UltimaOrg | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const [personasRes, orgRes] = await Promise.all([
        supabase.from('personas').select('id', { count: 'exact', head: true }),
        supabase
          .from('organizaciones')
          .select('id, fecha_inicio, fecha_fin, archivo_origen, datos')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      setPersonasCount(personasRes.count ?? 0)
      if (orgRes.data) setUltima(orgRes.data as UltimaOrg)
      setLoading(false)
    }
    cargar()
  }, [])

  const resumen = ultima?.datos?.resumen

  const cards = [
    {
      label: 'Personas en Personal fijo',
      value: loading ? '—' : String(personasCount ?? 0),
      icon: Users,
      tint: 'bg-office-50 text-office-600',
    },
    {
      label: 'Personas en la última organización',
      value: loading ? '—' : String(resumen?.personasEncontradas ?? '—'),
      icon: Sparkles,
      tint: 'bg-cocina-50 text-cocina-600',
    },
    {
      label: 'Asignaciones automáticas',
      value: loading ? '—' : String(resumen?.asignacionesAutomaticas ?? '—'),
      icon: CheckCircle2,
      tint: 'bg-menu-50 text-menu-600',
    },
    {
      label: 'Revisiones pendientes',
      value: loading ? '—' : String(resumen?.revisionesNecesarias ?? '—'),
      icon: AlertTriangle,
      tint: 'bg-cocina-50 text-cocina-600',
    },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">Organización de Alimentos</h1>
        <p className="text-ink-500 mt-1">
          Subí la planilla general del personal y generá automáticamente la organización de Alimentos.
        </p>
      </div>

      <Link
        to="/importar"
        className="flex items-center justify-between gap-4 bg-ink-900 text-white rounded-xl2 p-6 shadow-card hover:bg-ink-700 transition-colors mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Upload size={20} />
          </div>
          <div>
            <p className="font-display font-semibold">Importar Excel</p>
            <p className="text-white/70 text-sm">Subí la planilla general para generar la organización</p>
          </div>
        </div>
        <span className="text-white/70 text-sm hidden sm:block">Empezar →</span>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="bg-white rounded-xl2 shadow-soft p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tint}`}>
              <Icon size={17} />
            </div>
            <p className="text-2xl font-display font-bold text-ink-900">{value}</p>
            <p className="text-ink-500 text-sm mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {ultima ? (
        <Link
          to={`/semanal?id=${ultima.id}`}
          className="bg-white rounded-xl2 shadow-soft p-6 flex items-center gap-4 hover:bg-base-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-base-100 flex items-center justify-center text-ink-700 shrink-0">
            <Clock size={17} />
          </div>
          <div>
            <p className="font-medium text-ink-900 text-sm">
              Última organización: semana del {formatFechaLarga(ultima.fecha_inicio)} al{' '}
              {formatFechaLarga(ultima.fecha_fin)}
            </p>
            <p className="text-ink-500 text-sm mt-0.5">
              {ultima.archivo_origen ?? 'Sin archivo'} — hacé clic para verla
            </p>
          </div>
        </Link>
      ) : (
        !loading && (
          <div className="bg-white rounded-xl2 shadow-soft p-6 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-base-100 flex items-center justify-center text-ink-700 shrink-0">
              <Clock size={17} />
            </div>
            <div>
              <p className="font-medium text-ink-900 text-sm">Todavía no generaste ninguna organización</p>
              <p className="text-ink-500 text-sm mt-0.5">
                Importá un Excel para ver acá el resumen de la última organización generada.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
