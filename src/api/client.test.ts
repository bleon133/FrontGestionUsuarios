import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, http, setUnauthorizedHandler } from './client'
import { clearSession, readSession, saveSession } from '@/features/auth/session'

const BASE = 'http://test.local/api/v1'

function makeResponse(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body ?? {},
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response
}

function startSession(): void {
  saveSession({
    token: 'jwt-abc',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    usuario: {
      Id: 1,
      Username: 'ana',
      Suspendido: false,
      UsuariosRolesDtos: null,
      PerfilUsuarioDtos: null,
    },
  })
}

beforeEach(() => {
  clearSession()
  setUnauthorizedHandler(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('http', () => {
  it('adjunta el token de la sesión como Bearer', async () => {
    startSession()
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, []))
    vi.stubGlobal('fetch', fetchMock)

    await http.get('/Usuarios')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${BASE}/Usuarios`)
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-abc')
  })

  it('no adjunta Authorization cuando no hay sesión', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, []))
    vi.stubGlobal('fetch', fetchMock)

    await http.get('/Usuarios')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('el login no adjunta token aunque exista sesión', async () => {
    startSession()
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await http.post('/Usuarios/login', { Username: 'a', Password: 'b' }, { anonymous: true })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('un 401 limpia la sesión y avisa para redirigir', async () => {
    startSession()
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(401, {})))

    await expect(http.get('/Usuarios')).rejects.toBeInstanceOf(ApiError)
    expect(readSession()).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('un 401 en el login no redirige y usa el mensaje de credenciales', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(401, {})))

    await expect(
      http.post('/Usuarios/login', { Username: 'a', Password: 'b' }, { anonymous: true }),
    ).rejects.toThrow('Usuario o contraseña incorrectos.')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('un 403 lanza ApiError con el mensaje de permisos', async () => {
    startSession()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(403, { message: 'otro' })))

    await expect(http.get('/roles')).rejects.toThrow('No tienes permiso para esta acción.')
  })
})
