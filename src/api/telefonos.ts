import { http } from '@/api/client'
import type { TelefonoPayload } from '@/api/types'

export const telefonosApi = {
  create: (payload: TelefonoPayload) => http.post<boolean>('/Telefonos', payload),
  update: (id: number, payload: TelefonoPayload) =>
    http.put<boolean>(`/Telefonos/${id}`, payload),
  remove: (id: number) => http.delete<boolean>(`/Telefonos/${id}`),
}
