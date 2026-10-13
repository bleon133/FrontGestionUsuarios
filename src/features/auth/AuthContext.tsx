import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { usuariosApi } from '@/api/usuarios'
import { ApiError } from '@/api/client'
import { clearSession, readSession, saveSession, type SessionUser } from './session'

interface AuthContextValue {
  user: SessionUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readSession())

  const login = useCallback(async (username: string, password: string) => {
    const trimmedUser = username.trim()
    try {
      const usuario = await usuariosApi.login({ Username: trimmedUser, Password: password })
      setUser(saveSession(usuario))
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) throw new Error('Usuario o contraseña incorrectos.')
        if (error.status === 403) throw new Error('Tu cuenta está suspendida.')
        throw new Error(error.message)
      }
      throw new Error('No se pudo conectar con el servidor.')
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
