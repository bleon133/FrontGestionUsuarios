/** Pestañas del modal de perfil. */
export type PerfilTab = 'perfil' | 'direcciones' | 'telefonos'

export interface DireccionDraft {
  key: number
  Id?: number
  Calle: string
  Colonia: string
  Municipio: string
  NumExterior: string
  NumInterior: string
}

export interface TelefonoDraft {
  key: number
  Id?: number
  Celular: string
  Casa: string
  Oficina: string
}

export interface PerfilForm {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  rfc: string
  fechaNacimiento: string
  idUsuario: string
}

export const DIGITS_10 = /^[0-9]{10}$/

let draftKey = 0

/** Clave local estable para listas de bloques editables. */
export function nextDraftKey(): number {
  return draftKey++
}

export function emptyDireccion(): DireccionDraft {
  return { key: nextDraftKey(), Calle: '', Colonia: '', Municipio: '', NumExterior: '', NumInterior: '' }
}

export function emptyTelefono(): TelefonoDraft {
  return { key: nextDraftKey(), Celular: '', Casa: '', Oficina: '' }
}

/** Indica si el bloque tiene algún dato capturado. */
export function direccionCapturada(dir: DireccionDraft): boolean {
  return Boolean(dir.Calle.trim() || dir.Colonia.trim() || dir.Municipio.trim())
}

export function telefonoCapturado(tel: TelefonoDraft): boolean {
  return Boolean(tel.Celular.trim() || tel.Casa.trim() || tel.Oficina.trim())
}
