/**
 * Tipos de la API. Reflejan el contrato real de Swagger (JSON en PascalCase),
 * por eso se mantienen tal cual, sin convertir a camelCase.
 */

export interface RolesDto {
  Id: number
  Valor: string
  Descripcion: string | null
}

export interface UsuarioRolesDto {
  Id: number
  IdUsuario: number
  IdRol: number
  RolesDto: RolesDto | null
  UsuariosDto: UsuariosDto | null
}

export interface DireccionDto {
  Id: number
  Calle: string | null
  Colonia: string | null
  NumInterior: string | null
  NumExterior: string | null
  Municipio: string | null
  IdPerfilUsuario: number
  PerfilUsuarioDto: PerfilUsuarioDto | null
}

export interface TelefonosDto {
  Id: number
  Celular: string | null
  Casa: string | null
  Oficina: string | null
  IdPerfilUsuario: number
  PerfilUsuarioDto: PerfilUsuarioDto | null
}

export interface PerfilUsuarioDto {
  Id: number
  Nombre: string | null
  ApellidoPaterno: string | null
  ApellidoMaterno: string | null
  FechaNacimiento: string | null
  Rfc: string | null
  IdUsuario: number | null
  DireccionDtos: DireccionDto[] | null
  TelefonosDtos: TelefonosDto[] | null
}

export interface UsuariosDto {
  Id: number
  Username: string
  Suspendido: boolean
  UsuariosRolesDtos: UsuarioRolesDto[] | null
  PerfilUsuarioDtos: PerfilUsuarioDto[] | null
}

/** Credenciales de login. */
export interface LoginDto {
  Username: string
  Password: string
}

/** Respuesta de POST /Usuarios/login: token JWT, expiración ISO UTC y usuario. */
export interface LoginResponse {
  token: string
  expiresAt: string
  usuario: UsuariosDto
}

/* Payloads de escritura */

export interface UsuarioCreatePayload {
  Username: string
  Password: string
  Suspendido: boolean
}

export interface UsuarioUpdatePayload {
  Username: string
  Suspendido: boolean
  /** Solo se envía si el usuario escribió una contraseña nueva. */
  Password?: string
}

export interface RolPayload {
  Valor: string
  Descripcion: string | null
}

export interface PerfilPayload {
  Nombre: string
  ApellidoPaterno: string
  ApellidoMaterno: string | null
  Rfc: string | null
  FechaNacimiento: string
  IdUsuario: number
}

export interface DireccionPayload {
  Calle: string
  Colonia: string
  Municipio: string
  NumExterior: string | null
  NumInterior: string | null
  IdPerfilUsuario: number
}

export interface TelefonoPayload {
  Celular: string
  Casa: string | null
  Oficina: string | null
  IdPerfilUsuario: number
}

export interface UsuarioRolesPayload {
  IdUsuario: number
  IdRol: number
}
