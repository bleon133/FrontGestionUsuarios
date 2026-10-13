import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Search, Table2, Trash2 } from 'lucide-react'
import { perfilesApi } from '@/api/perfiles'
import type { PerfilUsuarioDto } from '@/api/types'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { Skeleton } from '@/components/Skeleton'
import { EmptyState } from '@/components/EmptyState'
import { Pagination, PAGE_SIZE } from '@/components/Pagination'
import { birthdayKey, formatDate, fullName } from '@/utils/format'
import styles from './ListadoPage.module.css'
import shared from '@/styles/shared.module.css'

export function ListadoPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<PerfilUsuarioDto | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['perfiles'],
    queryFn: perfilesApi.list,
  })

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
    // Ordena por mes y día de nacimiento (cumpleaños), no por fecha completa.
    const list = [...(data ?? [])].sort(
      (a, b) => birthdayKey(a.FechaNacimiento) - birthdayKey(b.FechaNacimiento),
    )
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter((perfil) => {
      const nombre = fullName(perfil).toLowerCase()
      const direccion = (perfil.DireccionDtos ?? [])
        .map((dir) => `${dir.Calle ?? ''} ${dir.Colonia ?? ''} ${dir.Municipio ?? ''}`)
        .join(' ')
        .toLowerCase()
      return nombre.includes(query) || (perfil.Rfc ?? '').toLowerCase().includes(query) || direccion.includes(query)
    })
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Listado general</h1>
          <p className={shared.pageDescription}>
            Perfiles con su primera dirección y teléfonos, ordenados por cumpleaños.
          </p>
        </div>
        <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={15} aria-hidden="true" className={isFetching ? styles.spin : undefined} />
          Actualizar
        </Button>
      </header>

      <section className={shared.card}>
        <div className={shared.cardHeader}>
          <h2 className={shared.cardTitle}>{filtered.length} registros</h2>
          <div className={styles.searchBox}>
            <Search size={15} aria-hidden="true" />
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre, RFC, municipio…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <Skeleton rows={8} />
        ) : isError ? (
          <div className={styles.errorBox}>
            <p>No se pudo cargar el listado.</p>
            <Button variant="secondary" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Table2 size={20} aria-hidden="true" />}
            title="Sin registros"
            description={search ? 'Ningún perfil coincide con la búsqueda.' : 'Aún no hay perfiles.'}
          />
        ) : (
          <div className={styles.list}>
            {paged.map((perfil) => {
              const direccion = (perfil.DireccionDtos ?? [])[0]
              const telefono = (perfil.TelefonosDtos ?? [])[0]
              return (
                <article key={perfil.Id} className={styles.row}>
                  <div className={styles.main}>
                    <h3 className={styles.name}>{fullName(perfil)}</h3>
                    <p className={styles.meta}>
                      {perfil.Rfc || 'Sin RFC'} · Nacimiento {formatDate(perfil.FechaNacimiento)}
                    </p>
                  </div>
                  <div className={styles.columns}>
                    <div>
                      <span className={styles.label}>Dirección</span>
                      <span className={styles.value}>
                        {direccion
                          ? `${direccion.Calle ?? ''} ${direccion.NumExterior ?? ''}, ${direccion.Colonia ?? ''}`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className={styles.label}>Celular</span>
                      <span className={styles.value}>{telefono?.Celular || '—'}</span>
                    </div>
                    <div>
                      <span className={styles.label}>Casa</span>
                      <span className={styles.value}>{telefono?.Casa || '—'}</span>
                    </div>
                    <div>
                      <span className={styles.label}>Oficina</span>
                      <span className={styles.value}>{telefono?.Oficina || '—'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    title="Eliminar perfil completo"
                    aria-label="Eliminar perfil completo"
                    onClick={() => setToDelete(perfil)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </article>
              )
            })}
            </div>
          )}

          <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </section>

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
