import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Power, Trash2, Search, Users } from 'lucide-react'
import { usuariosApi } from '@/api/usuarios'
import type { UsuariosDto } from '@/api/types'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable, type Column } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Pagination, PAGE_SIZE } from '@/components/Pagination'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { UsuarioFormModal } from './UsuarioFormModal'
import styles from './UsuariosPage.module.css'
import shared from '@/styles/shared.module.css'

type PendingAction = { type: 'toggle' | 'delete'; usuario: UsuariosDto } | null

export function UsuariosPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UsuariosDto | null>(null)
  const [pending, setPending] = useState<PendingAction>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosApi.list,
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => usuariosApi.toggleSuspendido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Estado del usuario actualizado.')
      setPending(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al actualizar.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usuariosApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['perfiles'] })
      toast.success('Usuario eliminado.')
      setPending(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Error al eliminar.'),
  })

  const filtered = useMemo(() => {
    const list = data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter((usuario) => usuario.Username.toLowerCase().includes(query))
  }, [data, search])

  const pageSize = PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const columns: Column<UsuariosDto>[] = [
    { key: 'id', header: '#', render: (row) => row.Id },
    {
      key: 'username',
      header: 'Usuario',
      render: (row) => <span className={styles.username}>{row.Username}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) =>
        row.Suspendido ? <Badge tone="danger">Suspendido</Badge> : <Badge tone="ok">Activo</Badge>,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (row) => {
        const roles = row.UsuariosRolesDtos ?? []
        if (roles.length === 0) return <span className={styles.muted}>Sin roles</span>
        return (
          <div className={styles.chips}>
            {roles.map((ur) => (
              <Badge key={ur.Id} tone="neutral">
                {ur.RolesDto?.Valor ?? `Rol #${ur.IdRol}`}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      key: 'perfiles',
      header: 'Perfiles',
      render: (row) => <span className={styles.count}>{row.PerfilUsuarioDtos?.length ?? 0}</span>,
    },
  ]

  return (
    <>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Usuarios</h1>
          <p className={shared.pageDescription}>
            Cuentas del sistema, su estado y los roles asignados.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Nuevo usuario
        </Button>
      </header>

      <section className={shared.card}>
        <div className={shared.cardHeader}>
          <h2 className={shared.cardTitle}>{filtered.length} usuarios</h2>
          <div className={styles.search}>
            <Search size={15} aria-hidden="true" />
            <input
              className={styles.searchInput}
              placeholder="Buscar por usuario…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton rows={6} />
        ) : isError ? (
          <div className={styles.errorBox}>
            <p>{error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.'}</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paged}
              rowKey={(row) => row.Id}
              empty={
                <EmptyState
                  icon={<Users size={20} aria-hidden="true" />}
                  title="Sin usuarios"
                  description={
                    search ? 'Ningún usuario coincide con la búsqueda.' : 'Aún no hay usuarios registrados.'
                  }
                />
              }
              actions={(row) => (
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    title="Editar"
                    aria-label="Editar usuario"
                    onClick={() => {
                      setEditing(row)
                      setModalOpen(true)
                    }}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    title={row.Suspendido ? 'Reactivar' : 'Suspender'}
                    aria-label={row.Suspendido ? 'Reactivar usuario' : 'Suspender usuario'}
                    onClick={() => setPending({ type: 'toggle', usuario: row })}
                  >
                    <Power size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    title="Eliminar"
                    aria-label="Eliminar usuario"
                    onClick={() => setPending({ type: 'delete', usuario: row })}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              )}
            />

            {filtered.length > pageSize && (
              <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </section>

      {modalOpen && (
        <UsuarioFormModal
          usuario={editing}
          onClose={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={pending?.type === 'delete'}
        danger
        title="Eliminar usuario"
        message={
          pending?.type === 'delete'
            ? `Se eliminará la cuenta "${pending.usuario.Username}". Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        busy={deleteMutation.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && deleteMutation.mutate(pending.usuario.Id)}
      />

      <ConfirmDialog
        open={pending?.type === 'toggle'}
        danger={false}
        title={pending?.usuario.Suspendido ? 'Reactivar usuario' : 'Suspender usuario'}
        message={
          pending?.type === 'toggle'
            ? pending.usuario.Suspendido
              ? `Se reactivará el acceso de "${pending.usuario.Username}".`
              : `Se suspenderá el acceso de "${pending.usuario.Username}" hasta que se reactive.`
            : ''
        }
        confirmLabel={pending?.usuario.Suspendido ? 'Reactivar' : 'Suspender'}
        busy={toggleMutation.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && toggleMutation.mutate(pending.usuario.Id)}
      />
    </>
  )
}
