import type { UsuariosDto } from '@/api/types'

/**
 * Sesión del cliente.
 *
 * IMPORTANTE: el backend no emite token ni sesión propia todavía. El "login"
 * es una llamada a POST /Usuarios/login que valida credenciales en servidor y
 * devuelve el usuario (sin contraseña). Del usuario solo persistimos lo mínimo
 * para la interfaz: { id, username }. Nunca se guarda la contraseña ni el
 * objeto completo.
 *
 * Cuando el backend implemente autenticación real (JWT o cookies), este módulo
 * debe reemplazar el almacenamiento local por el token que devuelva el login.
 */

export interface SessionUser {
  id: number
  username: string
}

const STORAGE_KEY = 'sgu.session'

export function readSession(): SessionUser | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SessionUser
    if (typeof parsed.id !== 'number' || typeof parsed.username !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function saveSession(user: UsuariosDto): SessionUser {
  const session: SessionUser = { id: user.Id, username: user.Username }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
