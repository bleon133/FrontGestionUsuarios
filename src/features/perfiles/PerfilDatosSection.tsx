import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { UsuariosDto } from '@/api/types'
import { rules } from '@/utils/validation'
import type { PerfilForm } from './perfilForm.types'
import styles from './PerfilFormModal.module.css'
import shared from '@/styles/shared.module.css'

interface PerfilDatosSectionProps {
  active: boolean
  register: UseFormRegister<PerfilForm>
  errors: FieldErrors<PerfilForm>
  usuarios: UsuariosDto[]
}

/** Pestaña "Perfil": datos personales y usuario asociado. */
export function PerfilDatosSection({ active, register, errors, usuarios }: PerfilDatosSectionProps) {
  return (
    <div
      className={active ? styles.listSection : styles.hidden}
      role="tabpanel"
      aria-label="Perfil"
    >
      <div className={shared.gridTwo}>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="p-nombre">
            Nombre
          </label>
          <input id="p-nombre" className={shared.input} {...register('nombre', rules.nombre)} />
          {errors.nombre && <span className={shared.error}>{errors.nombre.message}</span>}
        </div>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="p-pat">
            Apellido paterno
          </label>
          <input id="p-pat" className={shared.input} {...register('apellidoPaterno', rules.nombre)} />
          {errors.apellidoPaterno && (
            <span className={shared.error}>{errors.apellidoPaterno.message}</span>
          )}
        </div>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="p-mat">
            Apellido materno <span className={shared.labelOptional}>(opcional)</span>
          </label>
          <input
            id="p-mat"
            className={shared.input}
            {...register('apellidoMaterno', rules.nombreOpcional)}
          />
          {errors.apellidoMaterno && (
            <span className={shared.error}>{errors.apellidoMaterno.message}</span>
          )}
        </div>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="p-rfc">
            RFC <span className={shared.labelOptional}>(opcional)</span>
          </label>
          <input
            id="p-rfc"
            className={shared.input}
            maxLength={13}
            style={{ textTransform: 'uppercase' }}
            {...register('rfc', rules.rfc)}
          />
          {errors.rfc && <span className={shared.error}>{errors.rfc.message}</span>}
        </div>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="p-fecha">
            Fecha de nacimiento
          </label>
          <input
            id="p-fecha"
            type="date"
            className={shared.input}
            {...register('fechaNacimiento', rules.fechaNoFutura)}
          />
          {errors.fechaNacimiento && (
            <span className={shared.error}>{errors.fechaNacimiento.message}</span>
          )}
        </div>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="p-usuario">
            Usuario
          </label>
          <select
            id="p-usuario"
            className={shared.select}
            {...register('idUsuario', { required: 'Selecciona un usuario.' })}
          >
            <option value="">Selecciona un usuario</option>
            {usuarios.map((usuario) => (
              <option key={usuario.Id} value={usuario.Id}>
                {usuario.Username}
              </option>
            ))}
          </select>
          {errors.idUsuario && <span className={shared.error}>{errors.idUsuario.message}</span>}
        </div>
      </div>
    </div>
  )
}
