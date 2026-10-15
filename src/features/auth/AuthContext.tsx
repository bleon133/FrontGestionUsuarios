import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { usuariosApi } from '@/api/usuarios'
import { ApiError, setUnauthorizedHandler } from '@/api/client'
import { clearSession, readSession, saveSession, type SessionUser } from './session'

interface AuthContextValue {
  user: SessionUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readSession())
  const navigate = useNavigate()

  // El cliente HTTP avisa aquí cuando un 401 invalida la sesión (token ausente
  // o expirado). Así la redirección al login vive en el árbol de React y el
  // cliente no necesita conocer el router.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      setUser(null)
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  const login = useCallback(async (username: string, password: string) => {
    const trimmedUser = username.trim()
    try {
      const response = await usuariosApi.login({ Username: trimmedUser, Password: password })
      setUser(saveSession(response))
    } catch (error) {
      if (error instanceof ApiError) throw new Error(error.message, { cause: error })
      throw new Error('No se pudo conectar con el servidor.', { cause: error })
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
