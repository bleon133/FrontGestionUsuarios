/**
 * Cliente HTTP único. Conoce la URL base, adjunta el token de la sesión en
 * cada petición autenticada y traduce los errores del backend. La sesión se lee
 * de `features/auth/session`, que es la única fuente del token.
 */

import { clearSession, readSession } from '@/features/auth/session'

const BASE_URL = import.meta.env.VITE_API_URL

if (!BASE_URL) {
  // No se lanza aquí para no tumbar el arranque de la app: se avisa en consola
  // y cada petición fallará con un mensaje claro que la UI puede mostrar.
  console.error(
    'Falta VITE_API_URL. Copia .env.example a .env y define la URL de la API.',
  )
}

/** Error de API con el código HTTP para poder mapearlo en la UI. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Cuerpo opcional que el backend puede devolver en un error. */
interface ErrorBody {
  message?: string
  Message?: string
}

interface RequestOptions {
  /** Petición sin sesión (login): no adjunta token ni reacciona a un 401. */
  anonymous?: boolean
}

/**
 * Acción a ejecutar cuando el servidor responde 401 en una petición
 * autenticada. La registra AuthContext para poder redirigir al login sin que
 * este módulo dependa del router.
 */
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

function defaultMessage(status: number, anonymous: boolean): string {
  switch (status) {
    case 400:
      return 'Los datos enviados no son válidos.'
    case 401:
      return anonymous
        ? 'Usuario o contraseña incorrectos.'
        : 'Tu sesión expiró. Inicia sesión de nuevo.'
    case 403:
      return 'No tienes permiso para esta acción.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 409:
      return 'La operación no se pudo completar por un conflicto.'
    case 500:
      return 'Ocurrió un error en el servidor. Intenta de nuevo.'
    default:
      return `Error inesperado (${status}).`
  }
}

async function parseError(response: Response, anonymous: boolean): Promise<ApiError> {
  let backend = ''
  try {
    const body = (await response.json()) as ErrorBody
    backend = body.message ?? body.Message ?? ''
  } catch {
    // El cuerpo no es JSON: se responde con el mensaje por defecto del estado.
  }
  // En 403 de una petición autenticada el mensaje es siempre el mismo; en el login
  // se respeta el del backend (cuenta suspendida).
  const message =
    response.status === 403 && !anonymous
      ? defaultMessage(403, anonymous)
      : backend || defaultMessage(response.status, anonymous)
  return new ApiError(response.status, message)
}

function handleUnauthorized(): void {
  clearSession()
  unauthorizedHandler?.()
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, 'La aplicación no tiene configurada VITE_API_URL.')
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (!options.anonymous) {
    const session = readSession()
    if (session) headers.Authorization = `Bearer ${session.token}`
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.')
  }

  if (!response.ok) {
    // Un 401 fuera del login significa que el token faltó o expiró: la sesión
    // deja de ser válida y se avisa a la app para volver al login.
    if (response.status === 401 && !options.anonymous) handleUnauthorized()
    throw await parseError(response, options.anonymous ?? false)
  }

  // POST, PUT y DELETE responden solo `true`.
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

