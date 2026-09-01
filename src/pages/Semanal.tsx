import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Printer, FileSpreadsheet, CalendarDays, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useOrgStore } from '../lib/store'
import { OrganizacionGenerada, Categoria, CATEGORIA_LABEL, CATEGORIA_ORDEN } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { horarioAMinutos } from '../lib/motor'
import { exportarExcel } from '../lib/excelExport'
import CarteleraView from '../components/CarteleraView'

export default function Semanal() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const actual = useOrgStore((s) => s.actual)
  const setActual = useOrgStore((s) => s.setActual)

  const [org, setOrg] = useState<OrganizacionGenerada | null>(actual)
  const [cargando, setCargando] = useState(!!id)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | 'todos'>('todos')
  const [guardandoCambios, setGuardandoCambios] = useState(false)

  useEffect(() => {
    if (!id) {
      setOrg(actual)
      return
    }
    setCargando(true)
    supabase
      .from('organizaciones')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          const cargada = data.datos as OrganizacionGenerada
          setOrg({ ...cargada, id: data.id })
          setActual({ ...cargada, id: data.id })
        }
        setCargando(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function cambiarNota(fecha: string, texto: string) {
    setOrg((prev) => {
      if (!prev) return prev
      const actualizada = { ...prev, notasPorDia: { ...(prev.notasPorDia ?? {}), [fecha]: texto } }
      setActual(actualizada)
      return actualizada
    })
  }

  async function guardarCambios() {
    if (!org?.id) return
    setGuardandoCambios(true)
    await supabase.from('organizaciones').update({ datos: org }).eq('id', org.id)
    setGuardandoCambios(false)
  }

  const asignacionesFiltradas = useMemo(() => {
    if (!org) return []
    return org.asignaciones.filter((a) => {
      if (filtroCategoria !== 'todos' &&
