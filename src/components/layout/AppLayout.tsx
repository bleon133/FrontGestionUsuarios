import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Shield,
  IdCard,
  MapPin,
  Table2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { todayLabel } from '@/utils/format'
import styles from './AppLayout.module.css'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/usuarios', label: 'Usuarios', icon: Users, end: false },
  { to: '/roles', label: 'Roles', icon: Shield, end: false },
  { to: '/perfiles', label: 'Perfiles', icon: IdCard, end: false },
  { to: '/direcciones', label: 'Direcciones', icon: MapPin, end: false },
  { to: '/listado', label: 'Listado general', icon: Table2, end: false },
]

export function AppLayout() {
  const [expanded, setExpanded] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`${styles.shell} ${expanded ? styles.expanded : ''}`}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>S</span>
          {expanded && <span className={styles.brandText}>SGU</span>}
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              title={expanded ? undefined : label}
            >
              <Icon size={18} aria-hidden="true" />
              {expanded && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.navItem}
            onClick={() => setExpanded((value) => !value)}
            title={expanded ? 'Contraer menú' : 'Expandir menú'}
          >
            {expanded ? (
              <PanelLeftClose size={18} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={18} aria-hidden="true" />
            )}
            {expanded && <span>Contraer</span>}
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${styles.logout}`}
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut size={18} aria-hidden="true" />
            {expanded && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.date}>{todayLabel()}</span>
          <div className={styles.topbarRight}>
            <span className={styles.user}>{user?.username}</span>
            <button
              type="button"
              className={styles.mobileLogout}
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
