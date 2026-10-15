import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, readSession, saveSession } from './session'

const usuario = {
  Id: 7,
  Username: 'ana',
  Suspendido: false,
  UsuariosRolesDtos: null,
  PerfilUsuarioDtos: null,
}

function futureIso(minutes = 60): string {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

beforeEach(() => {
  clearSession()
  vi.useRealTimers()
})

describe('saveSession', () => {
  it('guarda id, username, token y expiresAt', () => {
    const expiresAt = futureIso()
    const session = saveSession({ token: 'jwt-123', expiresAt, usuario })

    expect(session).toEqual({ id: 7, username: 'ana', token: 'jwt-123', expiresAt })
    expect(readSession()).toEqual(session)
    expect(sessionStorage.getItem('sgu.session')).toContain('jwt-123')
  })

  it('no persiste la contraseña ni el resto del objeto', () => {
    saveSession({ token: 't', expiresAt: futureIso(), usuario })
    const raw = sessionStorage.getItem('sgu.session') ?? ''
    expect(raw).not.toContain('Password')
    expect(raw).not.toContain('Suspendido')
  })
})

describe('readSession', () => {
  it('devuelve null si no hay sesión', () => {
    expect(readSession()).toBeNull()
  })

  it('devuelve null y limpia la sesión si el token expiró', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
    saveSession({ token: 't', expiresAt: '2029-01-01T00:00:00Z', usuario })

    expect(readSession()).toBeNull()
    expect(sessionStorage.getItem('sgu.session')).toBeNull()
  })

  it('devuelve null ante contenido corrupto', () => {
    sessionStorage.setItem('sgu.session', '{no es json')
    expect(readSession()).toBeNull()
  })
})
