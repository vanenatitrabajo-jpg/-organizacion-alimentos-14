import { BarChart3 } from 'lucide-react'
import ProximamenteCard from '../components/ProximamenteCard'

export default function Reportes() {
  return (
    <ProximamenteCard
      icon={BarChart3}
      title="Reportes"
      description="Reportes de cobertura por sector, horas trabajadas y revisiones pendientes."
    />
  )
}
