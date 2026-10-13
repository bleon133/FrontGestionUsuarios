import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import styles from './LoginPage.module.css'

interface LoginForm {
  username: string
  password: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { username: '', password: '' } })

  const onSubmit = async (values: LoginForm) => {
    setServerError(null)
    try {
      await login(values.username, values.password)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.box} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.brand}>
          <span className={styles.mark}>S</span>
          <span className={styles.brandText}>SGU</span>
        </div>

        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Sistema de Gestión de Usuarios</p>

        {serverError && (
          <p className={styles.alert} role="alert">
            {serverError}
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            className={styles.input}
            autoComplete="username"
            autoFocus
            {...register('username', { required: 'Ingresa tu usuario.' })}
          />
          {errors.username && <span className={styles.error}>{errors.username.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Contraseña
          </label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={styles.input}
              autoComplete="current-password"
              {...register('password', { required: 'Ingresa tu contraseña.' })}
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className={styles.error}>{errors.password.message}</span>}
        </div>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          <LogIn size={16} aria-hidden="true" />
          {isSubmitting ? 'Verificando…' : 'Ingresar'}
        </button>

        <p className={styles.footnote}>
          La validación de credenciales se realiza en el servidor.
        </p>
      </form>
    </div>
  )
}
