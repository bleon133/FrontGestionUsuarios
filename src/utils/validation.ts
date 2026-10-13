import type { FieldValues, RegisterOptions } from 'react-hook-form'

const EMAIL_SAFE = /^[A-Za-z0-9._-]+$/
const RFC_PATTERN = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i
const DIGITS_10 = /^[0-9]{10}$/

export const rules = {
  username: {
    required: 'El nombre de usuario es obligatorio.',
    minLength: { value: 3, message: 'Mínimo 3 caracteres.' },
    maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
    validate: (value: string) =>
      EMAIL_SAFE.test(value) || 'Solo letras, números, punto, guion y guion bajo.',
  } satisfies RegisterOptions<FieldValues, never>,

  passwordCreate: {
    required: 'La contraseña es obligatoria.',
    minLength: { value: 4, message: 'Mínimo 4 caracteres.' },
    maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
  } satisfies RegisterOptions<FieldValues, never>,

  passwordOptional: {
    validate: (value: string | undefined) =>
      !value || value.length >= 4 || 'Mínimo 4 caracteres.',
  } satisfies RegisterOptions<FieldValues, never>,

  rolValor: {
    required: 'El valor del rol es obligatorio.',
    maxLength: { value: 50, message: 'Máximo 50 caracteres.' },
  } satisfies RegisterOptions<FieldValues, never>,

  descripcion: {
    maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
  } satisfies RegisterOptions<FieldValues, never>,

  nombre: {
    required: 'El campo es obligatorio.',
    maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
  } satisfies RegisterOptions<FieldValues, never>,

  nombreOpcional: {
    maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
  } satisfies RegisterOptions<FieldValues, never>,

  rfc: {
    validate: (value: string | undefined) => {
      if (!value) return true
      const upper = value.toUpperCase()
      return RFC_PATTERN.test(upper) || 'RFC inválido (12 o 13 caracteres).'
    },
  } satisfies RegisterOptions<FieldValues, never>,

  fechaNoFutura: {
    required: 'La fecha es obligatoria.',
    validate: (value: string) =>
      new Date(value).getTime() <= Date.now() || 'La fecha no puede ser futura.',
  } satisfies RegisterOptions<FieldValues, never>,

  celular: {
    validate: (value: string | undefined) =>
      !value || DIGITS_10.test(value) || 'Debe tener 10 dígitos.',
  } satisfies RegisterOptions<FieldValues, never>,

  celularRequerido: {
    required: 'El celular es obligatorio en este bloque.',
    validate: (value: string) =>
      DIGITS_10.test(value) || 'Debe tener 10 dígitos.',
  } satisfies RegisterOptions<FieldValues, never>,

  telefonoOpcional: {
    validate: (value: string | undefined) =>
      !value || DIGITS_10.test(value) || 'Debe tener 10 dígitos.',
  } satisfies RegisterOptions<FieldValues, never>,
}
