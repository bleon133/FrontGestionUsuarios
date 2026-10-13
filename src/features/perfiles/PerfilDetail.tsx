import type { PerfilUsuarioDto } from '@/api/types'
import { formatDate, fullName } from '@/utils/format'
import styles from './PerfilDetail.module.css'

interface PerfilDetailProps {
  perfil: PerfilUsuarioDto
  username?: string
}

/** Vista de solo lectura de un perfil, con todas sus direcciones y teléfonos. */
export function PerfilDetail({ perfil, username }: PerfilDetailProps) {
  const direcciones = perfil.DireccionDtos ?? []
  const telefonos = perfil.TelefonosDtos ?? []

  return (
    <div className={styles.detail}>
      <section>
        <h3 className={styles.sectionTitle}>Datos</h3>
        <dl className={styles.grid}>
          <div>
            <dt>Nombre completo</dt>
            <dd>{fullName(perfil)}</dd>
          </div>
          <div>
            <dt>RFC</dt>
            <dd>{perfil.Rfc || '—'}</dd>
          </div>
          <div>
            <dt>Fecha de nacimiento</dt>
            <dd>{formatDate(perfil.FechaNacimiento)}</dd>
          </div>
          <div>
            <dt>Usuario</dt>
            <dd>{username ?? (perfil.IdUsuario ? `ID ${perfil.IdUsuario}` : '—')}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Direcciones ({direcciones.length})</h3>
        {direcciones.length === 0 ? (
          <p className={styles.empty}>Sin direcciones registradas.</p>
        ) : (
          <ul className={styles.list}>
            {direcciones.map((dir) => (
              <li key={dir.Id} className={styles.item}>
                <span className={styles.itemTitle}>
                  {dir.Calle || '—'} {dir.NumExterior || ''}
                  {dir.NumInterior ? ` int. ${dir.NumInterior}` : ''}
                </span>
                <span className={styles.itemMeta}>
                  {[dir.Colonia, dir.Municipio].filter(Boolean).join(', ') || '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Teléfonos ({telefonos.length})</h3>
        {telefonos.length === 0 ? (
          <p className={styles.empty}>Sin teléfonos registrados.</p>
        ) : (
          <ul className={styles.list}>
            {telefonos.map((tel) => (
              <li key={tel.Id} className={styles.item}>
                <span className={styles.itemTitle}>{tel.Celular || '—'}</span>
                <span className={styles.itemMeta}>
                  {[
                    tel.Casa ? `Casa ${tel.Casa}` : null,
                    tel.Oficina ? `Oficina ${tel.Oficina}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Sin teléfonos alternativos'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
