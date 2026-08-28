import { LucideIcon } from 'lucide-react'

export default function ProximamenteCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto mt-16 bg-white rounded-xl2 shadow-card p-10 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-base-100 flex items-center justify-center mb-5">
          <Icon size={26} className="text-ink-700" />
        </div>
        <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
        <p className="text-ink-500 text-sm mt-2 leading-relaxed">{description}</p>
        <span className="mt-5 text-xs font-medium text-cocina-600 bg-cocina-50 px-3 py-1 rounded-full">
          Próxima etapa de desarrollo
        </span>
      </div>
    </div>
  )
}
