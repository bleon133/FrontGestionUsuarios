import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, Shield } from 'lucide-react'
import { rolesApi } from '@/api/roles'
import { ApiError } from '@/api/client'
import type { RolesDto } from '@/api/types'
import { Button } from '@/components/Button'
import { DataTable, type Column } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Pagination, PAGE_SIZE } from '@/components/Pagination'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { RolFormModal } from './RolFormModal'
import styles from './RolesPage.module.css'
import shared from '@/styles/shared.module.css'

export function RolesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [nameQuery, setNameQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RolesDto | null>(null)
  const [toDelete, setToDelete] = useState<RolesDto | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  })

  const byNameQuery = useQuery({
    queryKey: ['roles', 'nombre', nameQuery],
    queryFn: () => rolesApi.byNombre(nameQuery),
    enabled: false,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Rol eliminado.')
      setToDelete(null)
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.status === 409
          ? error.message
          : error instanceof Error
            ? error.message
            : 'No se pudo eliminar.'
      toast.error(message)
      setToDelete(null)
    },
  })

  const filtered = useMemo(() => {
    const list = data ?? []
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter(
      (rol) =>
        rol.Valor.toLowerCase().includes(query) ||
        (rol.Descripcion ?? '').toLowerCase().includes(query),
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns: Column<RolesDto>[] = [
    { key: 'id', header: '#', render: (row) => row.Id },
    { key: 'valor', header: 'Valor', render: (row) => <span className={styles.valor}>{row.Valor}</span> },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (row) => <span className={styles.descripcion}>{row.Descripcion || '—'}</span>,
    },
  ]

  const runNameSearch = () => {
    if (!nameQuery.trim()) {
      toast.warning('Escribe un nombre para buscar.')
      return
    }
    void byNameQuery.refetch()
  }

  return (
    <>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Roles</h1>
          <p className={shared.pageDescription}>Roles disponibles para asignar a los usuarios.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Nuevo rol
        </Button>
      </header>

      <section className={styles.nameCard}>
        <h2 className={shared.cardTitle}>Consultar rol por nombre</h2>
        <div className={styles.nameSearch}>
          <input
            className={shared.input}
            placeholder="Nombre exacto del rol"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && runNameSearch()}
          />
          <Button variant="secondary" onClick={runNameSearch} disabled={byNameQuery.isFetching}>
            <Search size={15} aria-hidden="true" />
            Buscar
          </Button>
        </div>
        {byNameQuery.isError && <p className={styles.nameError}>No se encontró un rol con ese nombre.</p>}
        {byNameQuery.data && (
          <div className={styles.nameResult}>
            <span className={styles.valor}>{byNameQuery.data.Valor}</span>
            <span className={styles.descripcion}>{byNameQuery.data.Descripcion || '—'}</span>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(byNameQuery.data)
                setModalOpen(true)
              }}
            >
              <Pencil size={14} aria-hidden="true" />
              Editar
            </Button>
          </div>
        )}
      </section>

      <section className={shared.card}>
        <div className={shared.cardHeader}>
          <h2 className={shared.cardTitle}>{filtered.length} roles</h2>
          <div className={styles.searchBox}>
            <Search size={15} aria-hidden="true" />
            <input
              className={styles.searchInput}
              placeholder="Filtrar…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton rows={5} />
        ) : isError ? (
          <div className={styles.errorBox}>
            <p>No se pudieron cargar los roles.</p>
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
                icon={<Shield size={20} aria-hidden="true" />}
                title="Sin roles"
                description={search ? 'Ningún rol coincide con el filtro.' : 'Aún no hay roles.'}
              />
            }
            actions={(row) => (
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Editar"
                  aria-label="Editar rol"
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
                  aria-label="Eliminar rol"
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

        {modalOpen && <RolFormModal rol={editing} onClose={() => setModalOpen(false)} />}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar rol"
        message={
          toDelete
            ? `Se eliminará el rol "${toDelete.Valor}". Si está asignado a algún usuario, la operación fallará.`
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
