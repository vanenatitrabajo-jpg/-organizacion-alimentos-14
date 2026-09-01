import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parsearExcel } from '../lib/excelParser'
import { generarAsignaciones } from '../lib/motor'
import { useOrgStore } from '../lib/store'
import { AsignacionGenerada, Persona, CATEGORIA_LABEL } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

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
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())

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
      const { filas, hojasConAlimentos } = await parsearExcel(file, mes, anio)

      if (filas.length === 0) {
        setError(
          hojasConAlimentos === 0
            ? `No se encontraron hojas de días de ${MESES[mes - 1]} ${anio} en el archivo (revisá que el mes/año elegidos arriba sean los correctos), o no hay ninguna fila con "Alimentos" en esas hojas.`
            : 'Se encontraron hojas de "Alimentos" pero no se pudo leer ningún nombre en ellas.'
        )
        setProcesando(false)
        return
      }

      const { data } = await supabase.from('personas').select('*')
      const personas = (data ?? []) as Persona[]

      const generadas = generarAsignaciones(filas, personas)
