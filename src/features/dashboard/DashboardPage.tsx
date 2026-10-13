import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, IdCard, Shield, MapPin, ArrowRight } from 'lucide-react'
import { usuariosApi } from '@/api/usuarios'
import { perfilesApi } from '@/api/perfiles'
import { rolesApi } from '@/api/roles'
import { direccionesApi } from '@/api/direcciones'
import { useAuth } from '@/features/auth/AuthContext'
import styles from './DashboardPage.module.css'
import shared from '@/styles/shared.module.css'

export function DashboardPage() {
  const { user } = useAuth()

  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list })
  const perfiles = useQuery({ queryKey: ['perfiles'], queryFn: perfilesApi.list })
  const roles = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list })
  const direcciones = useQuery({ queryKey: ['direcciones'], queryFn: direccionesApi.list })

  const isLoading =
    usuarios.isLoading || perfiles.isLoading || roles.isLoading || direcciones.isLoading

  const suspendidos = usuarios.data?.filter((item) => item.Suspendido).length ?? 0
  const activos = (usuarios.data?.length ?? 0) - suspendidos

  const metrics = [
    { key: 'usuarios', label: 'Usuarios', value: usuarios.data?.length, icon: Users, href: '/usuarios', featured: true },
    { key: 'perfiles', label: 'Perfiles', value: perfiles.data?.length, icon: IdCard, href: '/perfiles', featured: false },
    { key: 'roles', label: 'Roles', value: roles.data?.length, icon: Shield, href: '/roles', featured: false },
    { key: 'direcciones', label: 'Direcciones', value: direcciones.data?.length, icon: MapPin, href: '/direcciones', featured: false },
  ]

  return (
    <>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Hola, {user?.username}</h1>
          <p className={shared.pageDescription}>Resumen del sistema y accesos directos.</p>
        </div>
      </header>

      <div className={styles.metrics}>
        {isLoading
          ? metrics.map((metric) => <div key={metric.key} className={styles.metricSkeleton} />)
          : metrics.map(({ key, label, value, icon: Icon, href, featured }) => (
              <Link
                key={key}
                to={href}
                className={`${styles.metric} ${featured ? styles.metricFeatured : ''}`}
              >
                <Icon size={18} aria-hidden="true" className={styles.metricIcon} />
                <span className={styles.metricValue}>{value ?? 0}</span>
                <span className={styles.metricLabel}>{label}</span>
              </Link>
            ))}
      </div>

      <div className={styles.accounts}>
        <Link to="/usuarios" className={styles.accountCard}>
          <span className={styles.accountValue}>{activos}</span>
          <span className={styles.accountLabel}>cuentas activas</span>
          <ArrowRight size={16} aria-hidden="true" className={styles.accountArrow} />
        </Link>
        <Link to="/usuarios" className={`${styles.accountCard} ${styles.accountCardDanger}`}>
          <span className={styles.accountValue}>{suspendidos}</span>
          <span className={styles.accountLabel}>cuentas suspendidas</span>
          <ArrowRight size={16} aria-hidden="true" className={styles.accountArrow} />
        </Link>
      </div>
    </>
  )
}
