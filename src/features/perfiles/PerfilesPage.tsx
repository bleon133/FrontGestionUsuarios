import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Eye, Search, IdCard } from 'lucide-react'
import { perfilesApi } from '@/api/perfiles'
import { usuariosApi } from '@/api/usuarios'
import type { PerfilUsuarioDto } from '@/api/types'
import { Button } from '@/components/Button'
import { DataTable, type Column } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { Pagination, PAGE_SIZE } from '@/components/Pagination'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { PerfilFormModal } from './PerfilFormModal'
import { PerfilDetail } from './PerfilDetail'
import { formatDate, fullName } from '@/utils/format'
import styles from './PerfilesPage.module.css'
import shared from '@/styles/shared.module.css'

export function PerfilesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PerfilUsuarioDto | null>(null)
  const [detail, setDetail] = useState<PerfilUsuarioDto | null>(null)
  const [toDelete, setToDelete] = useState<PerfilUsuarioDto | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['perfiles'],
    queryFn: perfilesApi.list,
  })

  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list })

  const usernamesById = useMemo(() => {
    const map = new Map<number, string>()
    for (const usuario of usuarios.data ?? []) map.set(usuario.Id, usuario.Username)
    return map
  }, [usuarios.data])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => perfilesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfiles'] })
      queryClient.invalidateQueries({ queryKey: ['direcciones'] })
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Perfil eliminado.')
      setToDelete(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar.')
      setToDelete(null)
    },
  })

  const filtered = useMemo(() => {
    const list = data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter((perfil) => {
      const nombre = fullName(perfil).toLowerCase()
      return nombre.includes(query) || (perfil.Rfc ?? '').toLowerCase().includes(query)
    })
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns: Column<PerfilUsuarioDto>[] = [
    { key: 'id', header: '#', render: (row) => row.Id },
    {
      key: 'nombre',
      header: 'Nombre completo',
      render: (row) => <span className={styles.nombre}>{fullName(row)}</span>,
    },
    {
      key: 'rfc',
      header: 'RFC',
      hideOnMobile: true,
      render: (row) => <span className={styles.rfc}>{row.Rfc || '—'}</span>,
    },
    {
      key: 'fecha',
      header: 'Nacimiento',
      hideOnMobile: true,
      render: (row) => formatDate(row.FechaNacimiento),
    },
    {
      key: 'usuario',
      header: 'Usuario',
      render: (row) =>
        row.IdUsuario ? (
          usernamesById.get(row.IdUsuario) ?? `ID ${row.IdUsuario}`
        ) : (
          <span className={styles.muted}>—</span>
        ),
    },
  ]

  return (
    <>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Perfiles</h1>
          <p className={shared.pageDescription}>
            Datos personales de cada usuario, con sus direcciones y teléfonos.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Nuevo perfil
        </Button>
      </header>

      <section className={shared.card}>
        <div className={shared.cardHeader}>
          <h2 className={shared.cardTitle}>{filtered.length} perfiles</h2>
          <div className={styles.searchBox}>
            <Search size={15} aria-hidden="true" />
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre o RFC…"
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
            <p>No se pudieron cargar los perfiles.</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={paged}
            rowKey={(row) => row.Id}
            empty={
              <EmptyState
                icon={<IdCard size={20} aria-hidden="true" />}
                title="Sin perfiles"
                description={
                  search ? 'Ningún perfil coincide con la búsqueda.' : 'Aún no hay perfiles registrados.'
                }
              />
            }
            actions={(row) => (
              <div className={styles.rowActions}>
                <button
                  type="button"
                    className={styles.iconBtn}
                    title="Ver detalle"
                    aria-label="Ver detalle del perfil"
                    onClick={() => setDetail(row)}
                >
                  <Eye size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                    className={styles.iconBtn}
                    title="Editar"
                    aria-label="Editar perfil"
                    onClick={() => {
                      setEditing(row)
                      setModalOpen(true)
                    }}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    title="Eliminar"
                    aria-label="Eliminar perfil"
                    onClick={() => setToDelete(row)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            )}
            />
          )}

          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </section>

        {modalOpen && <PerfilFormModal perfil={editing} onClose={() => setModalOpen(false)} />}

      <Modal
        open={detail !== null}
        title="Detalle del perfil"
        onClose={() => setDetail(null)}
        width={560}
      >
        {detail && <PerfilDetail perfil={detail} username={detail.IdUsuario ? usernamesById.get(detail.IdUsuario) : undefined} />}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar perfil"
        message={
          toDelete
            ? `Se eliminará el perfil de "${fullName(toDelete)}" junto con sus direcciones y teléfonos.`
            : ''
        }
        confirmLabel="Eliminar"
        busy={deleteMutation.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.Id)}
      />
    </>
  )
}
