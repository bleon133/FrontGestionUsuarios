/** Recorta espacios y convierte cadena vacía en null. */
export function trimOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** Recorta espacios manteniendo el valor como cadena. */
export function trim(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

/** Formatea una fecha ISO a dd/mm/aaaa. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Fecha de hoy en es-MX, para el encabezado. */
export function todayLabel(): string {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Nombre completo del perfil. */
export function fullName(perfil: {
  Nombre: string | null
  ApellidoPaterno: string | null
  ApellidoMaterno: string | null
}): string {
  return [perfil.Nombre, perfil.ApellidoPaterno, perfil.ApellidoMaterno]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
}

/** Mes y día de nacimiento, como número comparable (0101 a 1231). */
export function birthdayKey(fecha: string | null | undefined): number {
  if (!fecha) return 9999
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return 9999
  return (date.getMonth() + 1) * 100 + date.getDate()
}
