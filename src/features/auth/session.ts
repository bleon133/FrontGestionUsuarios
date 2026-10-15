import type { LoginResponse } from '@/api/types'

/**
 * Sesión del cliente.
 *
 * El backend emite un JWT en POST /Usuarios/login junto con su expiración
 * (ISO UTC) y el usuario. En sessionStorage se guarda lo mínimo para la
 * interfaz y para firmar cada petición: { id, username, token, expiresAt }.
 * Nunca se guarda la contraseña ni el objeto completo del usuario.
 *
 * La sesión caduca con el token: si `expiresAt` ya pasó, readSession devuelve
 * null y la descarta, de modo que las peticiones salgan sin Authorization y el
 * servidor responda 401.
 */

export interface SessionUser {
  id: number
  username: string
  token: string
  expiresAt: string
}

const STORAGE_KEY = 'sgu.session'

function isExpired(expiresAt: string): boolean {
  const time = new Date(expiresAt).getTime()
  if (Number.isNaN(time)) return true
  return time <= Date.now()
}

export function readSession(): SessionUser | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>
    if (
      typeof parsed.id !== 'number' ||
      typeof parsed.username !== 'string' ||
      typeof parsed.token !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null
    }
    if (isExpired(parsed.expiresAt)) {
      clearSession()
      return null
    }
    return {
      id: parsed.id,
      username: parsed.username,
      token: parsed.token,
      expiresAt: parsed.expiresAt,
    }
  } catch {
    return null
  }
}

export function saveSession(response: LoginResponse): SessionUser {
  const session: SessionUser = {
    id: response.usuario.Id,
    username: response.usuario.Username,
    token: response.token,
    expiresAt: response.expiresAt,
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
