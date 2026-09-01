import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parsearExcel } from '../lib/excelParser'
import { generarAsignaciones } from '../lib/motor'
import { useOrgStore } from '../lib/store'
import { AsignacionGenerada, Persona, CATEGORIA_LABEL } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'

export default function Importar() {
  const navigate = useNavigate()
  const setActual = useOrgStore((s) => s.setActual)
  const inputRef = useRef<HTMLInputElement>(null)

  const [archivo, setArchivo] = useState<File | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [asignaciones, setAsignaciones] = useState<AsignacionGenerada[] | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [tipo, setTipo] = useState<'semanal' | 'mensual'>('semanal')

  const resumen = useMemo(() => {
    if (!asignaciones) return null
    const fechas = new Set(asignaciones.map((a) => a.fecha).filter(Boolean))
    const nombres = new Set(asignaciones.map((a) => a.nombre))
    return {
      dias: fechas.size,
      personas: nombres.size,
      nuevas: asignaciones.filter((a) => a.esPersonaNueva).length,
    }
  }, [asignaciones])

  async function procesarArchivo(file: File) {
    setArchivo(file)
    setError(null)
    setAsignaciones(null)
    setProcesando(true)

    try {
      const anioActual = new Date().getFullYear()
      const { filas } = await parsearExcel(file, anioActual)

      if (filas.length === 0) {
        setError(
          'No se detectó ninguna fila con "Alimentos" en el archivo. Revisá que la palabra aparezca en la columna de sector/tarea de cada hoja.'
        )
        setProcesando(false)
        return
      }

      const { data } = await supabase.from('personas').select('*')
      const personas = (data ?? []) as Persona[]

      const generadas = generarAsignaciones(filas, personas)
      setAsignaciones(generadas)
    } catch {
      setError('No se pudo leer el archivo. Verificá que sea un Excel (.xlsx) válido.')
    } finally {
      setProcesando(false)
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) procesarArchivo(file)
  }

  async function confirmarYVerOrganizacion(guardarEnHistorial: boolean) {
    if (!asignaciones || asignaciones.length === 0) return
    const fechas = asignaciones.map((a) => a.fecha).filter(Boolean)
    const fechaInicio = fechas.length ? fechas.sort()[0] : new Date().toISOString().slice(0, 10)
    const fechaFin = fechas.length ? fechas.sort().slice(-1)[0] : fechaInicio

    const org = {
      tipo,
      fechaInicio,
      fechaFin,
      archivoOrigen: archivo?.name ?? 'archivo.xlsx',
      asignaciones,
      notasPorDia: {},
      resumen: {
        diasEncontrados: resumen?.dias ?? 0,
        personasEncontradas: resumen?.personas ?? 0,
        personasNuevas: resumen?.nuevas ?? 0,
        asignacionesAutomaticas: 0,
        conflictos: 0,
        sinPreferencias: 0,
        revisionesNecesarias: 0,
      },
    }

    if (guardarEnHistorial) {
      setGuardando(true)
      const { data } = await supabase
        .from('organizaciones')
        .insert({
          tipo: org.tipo,
          fecha_inicio: org.fechaInicio,
          fecha_fin: org.fechaFin,
          archivo_origen: org.archivoOrigen,
          datos: org,
        })
        .select()
        .single()
      setGuardando(false)
      setActual({ ...org, id: data?.id })
      const destino = tipo === 'mensual' ? '/mensual' : '/semanal'
      navigate(data?.id ? `${destino}?id=${data.id}` : destino)
    } else {
      setActual(org)
      navigate(tipo === 'mensual' ? '/mensual' : '/semanal')
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink-900">Importar organización</h1>
        <p className="text-ink-500 mt-1">
          Subí la planilla general (el mes completo o solo la semana). El sistema detecta cada
          bloque "Alimentos" y ubica a cada persona en Menú u Office según el horario.
        </p>
      </div>

      {!asignaciones && (
        <div className="mb-4 flex gap-2 no-print">
          {(['semanal', 'mensual'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                tipo === t ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-base-300'
              }`}
            >
              Generar {t}
            </button>
          ))}
        </div>
      )}

      {!asignaciones && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="bg-white rounded-xl2 shadow-card border-2 border-dashed border-base-300 p-12 flex flex-col items-center text-center cursor-pointer hover:border-cocina-400 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          <div className="w-14 h-14 rounded-2xl bg-cocina-50 flex items-center justify-center mb-4">
            {procesando ? (
              <Loader2 className="animate-spin text-cocina-600" size={24} />
            ) : (
              <Upload className="text-cocina-600" size={24} />
            )}
          </div>
          <p className="font-medium text-ink-900">
            {procesando ? 'Analizando el archivo…' : 'Arrastrá el Excel acá o hacé clic para elegirlo'}
          </p>
          <p className="text-ink-500 text-sm mt-1">Archivos .xlsx — el archivo original nunca se modifica</p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 rounded-xl2 p-4 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            {error}
            <button
              onClick={() => {
                setError(null)
                setAsignaciones(null)
              }}
              className="block mt-2 underline"
            >
              Probar con otro archivo
            </button>
          </div>
        </div>
      )}

      {asignaciones && resumen && (
        <>
          <div className="bg-white rounded-xl2 shadow-soft p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet size={17} className="text-ink-700" />
              <p className="font-medium text-ink-900 text-sm">{archivo?.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Días encontrados" value={resumen.dias} />
              <Stat label="Personas" value={resumen.personas} />
              <Stat label="Personas nuevas (revisar)" value={resumen.nuevas} tint="text-amber-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl2 shadow-soft divide-y divide-base-200 overflow-hidden mb-6 max-h-[420px] overflow-y-auto">
            {asignaciones.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                {a.esPersonaNueva ? (
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                ) : (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-office-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">
                    {a.nombre}
                    <span className="ml-2 text-xs font-medium text-ink-500">
                      {CATEGORIA_LABEL[a.categoria]} · {a.horarioTexto}
                    </span>
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {formatFechaLarga(a.fecha)}
                    {a.observaciones ? ` — ${a.observaciones}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => confirmarYVerOrganizacion(true)}
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-lg bg-ink-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors disabled:opacity-50"
            >
              {guardando && <Loader2 className="animate-spin" size={15} />}
              Generar y guardar en Historial
            </button>
            <button
              onClick={() => confirmarYVerOrganizacion(false)}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-ink-700 hover:bg-base-100 transition-colors border border-base-300"
            >
              Ver sin guardar
            </button>
            <button
              onClick={() => {
                setAsignaciones(null)
                setArchivo(null)
              }}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-ink-500 hover:bg-base-100 transition-colors"
            >
              Probar con otro archivo
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <div>
      <p className={`text-2xl font-display font-bold ${tint ?? 'text-ink-900'}`}>{value}</p>
      <p className="text-ink-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}
