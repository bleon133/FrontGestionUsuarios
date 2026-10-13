import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react'
import { direccionesApi } from '@/api/direcciones'
import { perfilesApi } from '@/api/perfiles'
import type { DireccionDto } from '@/api/types'
import { Button } from '@/components/Button'
import { DataTable, type Column } from '@/components/DataTable'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { Pagination, PAGE_SIZE } from '@/components/Pagination'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { rules } from '@/utils/validation'
import { fullName, trim, trimOrNull } from '@/utils/format'
import styles from './DireccionesPage.module.css'
import shared from '@/styles/shared.module.css'

interface DireccionForm {
  calle: string
  colonia: string
  municipio: string
  numExterior: string
  numInterior: string
  idPerfil: string
}

export function DireccionesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DireccionDto | null>(null)
  const [toDelete, setToDelete] = useState<DireccionDto | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['direcciones'],
    queryFn: direccionesApi.list,
  })
  const perfiles = useQuery({ queryKey: ['perfiles'], queryFn: perfilesApi.list })

  const perfilNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const perfil of perfiles.data ?? []) map.set(perfil.Id, fullName(perfil))
    return map
  }, [perfiles.data])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => direccionesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] })
      queryClient.invalidateQueries({ queryKey: ['perfiles'] })
      queryClient.invalidateQueries({ queryKey: ['listado'] })
      toast.success('Dirección eliminada.')
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
    return list.filter((dir) =>
      [dir.Calle, dir.Colonia, dir.Municipio].some((value) =>
        (value ?? '').toLowerCase().includes(query),
      ),
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns: Column<DireccionDto>[] = [
    { key: 'id', header: '#', render: (row) => row.Id },
    { key: 'calle', header: 'Calle', render: (row) => row.Calle || '—' },
    { key: 'colonia', header: 'Colonia', render: (row) => row.Colonia || '—' },
    { key: 'municipio', header: 'Municipio', render: (row) => row.Municipio || '—' },
    {
      key: 'numExt',
      header: 'Núm. ext.',
      hideOnMobile: true,
      render: (row) => row.NumExterior || '—',
    },
    {
      key: 'numInt',
      header: 'Núm. int.',
      hideOnMobile: true,
      render: (row) => row.NumInterior || '—',
    },
    {
      key: 'perfil',
      header: 'Perfil',
      render: (row) => perfilNameById.get(row.IdPerfilUsuario) ?? `ID ${row.IdPerfilUsuario}`,
    },
  ]

  return (
    <>
      <header className={shared.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Direcciones</h1>
          <p className={shared.pageDescription}>Direcciones asociadas a cada perfil.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Nueva dirección
        </Button>
      </header>

      <section className={shared.card}>
        <div className={shared.cardHeader}>
          <h2 className={shared.cardTitle}>{filtered.length} direcciones</h2>
          <div className={styles.searchBox}>
            <Search size={15} aria-hidden="true" />
            <input
              className={styles.searchInput}
              placeholder="Buscar calle, colonia, municipio…"
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
            <p>No se pudieron cargar las direcciones.</p>
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
                icon={<MapPin size={20} aria-hidden="true" />}
                title="Sin direcciones"
                description={search ? 'Ninguna dirección coincide.' : 'Aún no hay direcciones.'}
              />
            }
            actions={(row) => (
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Editar"
                  aria-label="Editar dirección"
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
                  aria-label="Eliminar dirección"
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

        {modalOpen && (
          <DireccionFormModal
            direccion={editing}
            perfiles={perfiles.data ?? []}
            onClose={() => setModalOpen(false)}
          />
        )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar dirección"
        message="Se eliminará esta dirección del perfil."
        confirmLabel="Eliminar"
        busy={deleteMutation.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.Id)}
      />
    </>
  )
}

function DireccionFormModal({
  direccion,
  perfiles,
  onClose,
}: {
  direccion: DireccionDto | null
  perfiles: { Id: number; Nombre: string | null; ApellidoPaterno: string | null; ApellidoMaterno: string | null }[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const isEdit = direccion !== null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DireccionForm>({
    defaultValues: {
      calle: direccion?.Calle ?? '',
      colonia: direccion?.Colonia ?? '',
      municipio: direccion?.Municipio ?? '',
      numExterior: direccion?.NumExterior ?? '',
      numInterior: direccion?.NumInterior ?? '',
      idPerfil: direccion ? String(direccion.IdPerfilUsuario) : '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: DireccionForm) => {
      const payload = {
        Calle: trim(values.calle),
        Colonia: trim(values.colonia),
        Municipio: trim(values.municipio),
        NumExterior: trimOrNull(values.numExterior),
        NumInterior: trimOrNull(values.numInterior),
        IdPerfilUsuario: Number(values.idPerfil),
      }
      return isEdit ? direccionesApi.update(direccion.Id, payload) : direccionesApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] })
      queryClient.invalidateQueries({ queryKey: ['perfiles'] })
      queryClient.invalidateQueries({ queryKey: ['listado'] })
      toast.success(isEdit ? 'Dirección actualizada.' : 'Dirección creada.')
      onClose()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar.')
    },
  })

  return (
    <Modal
      open
      title={isEdit ? `Editar dirección #${direccion.Id}` : 'Nueva dirección'}
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="dir-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="dir-form" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="d-calle">
            Calle
          </label>
          <input id="d-calle" className={shared.input} {...register('calle', rules.nombre)} />
          {errors.calle && <span className={shared.error}>{errors.calle.message}</span>}
        </div>

        <div className={shared.gridTwo}>
          <div className={shared.field}>
            <label className={shared.label} htmlFor="d-colonia">
              Colonia
            </label>
            <input id="d-colonia" className={shared.input} {...register('colonia', rules.nombre)} />
            {errors.colonia && <span className={shared.error}>{errors.colonia.message}</span>}
          </div>
          <div className={shared.field}>
            <label className={shared.label} htmlFor="d-municipio">
              Municipio
            </label>
            <input
              id="d-municipio"
              className={shared.input}
              {...register('municipio', rules.nombre)}
            />
            {errors.municipio && <span className={shared.error}>{errors.municipio.message}</span>}
          </div>
          <div className={shared.field}>
            <label className={shared.label} htmlFor="d-ext">
              Núm. exterior <span className={shared.labelOptional}>(opcional)</span>
            </label>
            <input id="d-ext" className={shared.input} {...register('numExterior')} />
          </div>
          <div className={shared.field}>
            <label className={shared.label} htmlFor="d-int">
              Núm. interior <span className={shared.labelOptional}>(opcional)</span>
            </label>
            <input id="d-int" className={shared.input} {...register('numInterior')} />
          </div>
        </div>

        <div className={shared.field}>
          <label className={shared.label} htmlFor="d-perfil">
            Perfil
          </label>
          <select
            id="d-perfil"
            className={shared.select}
            {...register('idPerfil', { required: 'Selecciona un perfil.' })}
          >
            <option value="">Selecciona un perfil</option>
            {perfiles.map((perfil) => (
              <option key={perfil.Id} value={perfil.Id}>
                {fullName(perfil)}
              </option>
            ))}
          </select>
          {errors.idPerfil && <span className={shared.error}>{errors.idPerfil.message}</span>}
        </div>
      </form>
    </Modal>
  )
}
