import type { PerfilUsuarioDto } from '@/api/types'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { PerfilDatosSection } from './PerfilDatosSection'
import { PerfilDireccionesSection } from './PerfilDireccionesSection'
import { PerfilTelefonosSection } from './PerfilTelefonosSection'
import { usePerfilForm } from './usePerfilForm'
import styles from './PerfilFormModal.module.css'

interface PerfilFormModalProps {
  perfil: PerfilUsuarioDto | null
  onClose: () => void
}

/** Contenedor del formulario de perfil: pestañas y secciones por bloque. */
export function PerfilFormModal({ perfil, onClose }: PerfilFormModalProps) {
  const {
    tab,
    setTab,
    direcciones,
    setDirecciones,
    telefonos,
    setTelefonos,
    usuariosDisponibles,
    form,
    saveMutation,
    submit,
    removeDireccion,
    removeTelefono,
    isEdit,
    perfilId,
  } = usePerfilForm(perfil, onClose)

  const {
    register,
    formState: { errors },
  } = form

  return (
    <Modal
      open
      title={isEdit && perfilId && perfilId > 0 ? `Editar perfil #${perfilId}` : 'Nuevo perfil'}
      onClose={onClose}
      width={640}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="perfil-form" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className={styles.tabs} role="tablist">
        {[
          { id: 'perfil' as const, label: 'Perfil' },
          { id: 'direcciones' as const, label: `Direcciones${direcciones.length ? ` (${direcciones.length})` : ''}` },
          { id: 'telefonos' as const, label: `Teléfonos${telefonos.length ? ` (${telefonos.length})` : ''}` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form id="perfil-form" onSubmit={submit} noValidate>
        <PerfilDatosSection
          active={tab === 'perfil'}
          register={register}
          errors={errors}
          usuarios={usuariosDisponibles}
        />
        <PerfilDireccionesSection
          active={tab === 'direcciones'}
          direcciones={direcciones}
          setDirecciones={setDirecciones}
          onRemove={removeDireccion}
        />
        <PerfilTelefonosSection
          active={tab === 'telefonos'}
          telefonos={telefonos}
          setTelefonos={setTelefonos}
          onRemove={removeTelefono}
        />
      </form>
    </Modal>
  )
}
