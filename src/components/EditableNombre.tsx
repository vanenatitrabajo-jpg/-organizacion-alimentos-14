import { useState, useEffect } from 'react'

interface Props {
  value: string
  onChange: (nuevoValor: string) => void
  className?: string
}

/**
 * Campo de texto inline para editar un nombre en el cuadro de la
 * organización. Se ve como texto plano (sin borde) hasta que se hace
 * clic o se pasa el mouse, y confirma el cambio recién al salir del
 * campo (blur) o al apretar Enter — así no dispara un cambio en cada
 * tecla. Con Escape se cancela y vuelve al valor anterior.
 */
export default function EditableNombre({ value, onChange, className = '' }: Props) {
  const [borrador, setBorrador] = useState(value)

  useEffect(() => {
    setBorrador(value)
  }, [value])

  function confirmar() {
    const limpio = borrador.trim()
    if (limpio && limpio !== value) {
      onChange(limpio)
    } else {
      setBorrador(value)
    }
  }

  return (
    <input
      value={borrador}
      onChange={(e) => setBorrador(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setBorrador(value)
          e.currentTarget.blur()
        }
      }}
      style={{ width: `${Math.max(borrador.length, 3) + 1}ch` }}
      className={`bg-transparent border-b border-transparent hover:border-ink-300 focus:border-ink-500 focus:outline-none px-0.5 ${className}`}
    />
  )
}
