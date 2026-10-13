/**
 * Cliente HTTP único. No hay estado ni sesión aquí: la sesión vive en
 * `features/auth` y hoy se limita a { id, username } en sessionStorage
 * (el backend aún no emite token).
 */

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

function messageFromStatus(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return fallback || 'Los datos enviados no son válidos.'
    case 401:
      return 'Usuario o contraseña incorrectos.'
    case 403:
      return 'Tu cuenta está suspendida.'
    case 404:
      return 'No se encontró el recurso solicitado.'
    case 409:
      return fallback || 'La operación no se pudo completar por un conflicto.'
    case 500:
      return 'Ocurrió un error en el servidor. Intenta de nuevo.'
    default:
      return fallback || `Error inesperado (${status}).`
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let fallback = ''
  try {
    const body = (await response.json()) as ErrorBody
    fallback = body.message ?? body.Message ?? ''
  } catch {
    fallback = ''
  }
  return new ApiError(response.status, messageFromStatus(response.status, fallback))
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError(0, 'La aplicación no tiene configurada VITE_API_URL.')
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.')
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  // POST, PUT y DELETE responden solo `true`.
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
