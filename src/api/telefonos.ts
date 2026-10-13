import { http } from '@/api/client'
import type { TelefonoPayload, TelefonosDto } from '@/api/types'

export const telefonosApi = {
  list: () => http.get<TelefonosDto[]>('/Telefonos'),
  get: (id: number) => http.get<TelefonosDto>(`/Telefonos/${id}`),
  byNumero: (celular: string) =>
    http.get<TelefonosDto>(`/Telefonos/numero/${encodeURIComponent(celular)}`),
  byPerfil: (idPerfil: number) => http.get<TelefonosDto[]>(`/Telefonos/perfil/${idPerfil}`),
  create: (payload: TelefonoPayload) => http.post<boolean>('/Telefonos', payload),
  update: (id: number, payload: TelefonoPayload) =>
    http.put<boolean>(`/Telefonos/${id}`, payload),
  remove: (id: number) => http.delete<boolean>(`/Telefonos/${id}`),
}
