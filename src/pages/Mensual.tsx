import { CalendarRange } from 'lucide-react'
import ProximamenteCard from '../components/ProximamenteCard'

export default function Mensual() {
  return (
    <ProximamenteCard
      icon={CalendarRange}
      title="Organización mensual"
      description="Vista mensual compacta, con posibilidad de ver por día, semana, persona o sector."
    />
  )
}
