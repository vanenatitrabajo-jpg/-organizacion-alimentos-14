import { AsignacionGenerada, CATEGORIA_COLOR_CLASSES, CATEGORIA_LABEL } from '../lib/types'
import { formatFechaLarga } from '../lib/dateUtils'
import { horarioAMinutos } from '../lib/motor'

interface Props {
  titulo?: string
  fechaInicio: string
  fechaFin: string
  asignaciones: AsignacionGenerada[]
  notasPorDia?: Record<string, string>
  onNotaChange?: (fecha: string, texto: string) => void
}

export default function CarteleraView({
  titulo = 'Organización de Alimentos',
  fechaInicio,
  fechaFin,
  asignaciones,
  notasPorDia,
  onNotaChange,
}: Props) {
  const dias = Array.from(new Set(asignaciones.map((a) => a.fecha))).sort()

  return (
    <div className="bg-white p-6 print:p-0">
      <div className="mb-5 print:mb-4">
        <h2 className="font-display text-xl font-bold text-ink-900 uppercase tracking-tight">{titulo}</h2>
        <p className="text-ink-500 text-sm">
          Del {formatFechaLarga(fechaInicio)} al {formatFechaLarga(fechaFin)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:grid-cols-4 gap-3">
        {dias.map((fecha) => (
          <DiaCard
            key={fecha}
            fecha={fecha}
            asignaciones={asignaciones.filter((a) => a.fecha === fecha)}
            nota={notasPorDia?.[fecha] ?? ''}
            onNotaChange={onNotaChange ? (texto) =>
