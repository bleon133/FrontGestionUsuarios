import { describe, expect, it } from 'vitest'
import { rules } from '@/utils/validation'

describe('rules.username', () => {
  it('exige el campo', () => {
    expect(rules.username.required).toBeTruthy()
  })

  it('solo admite letras, números, punto, guion y guion bajo', () => {
    expect(rules.username.validate?.('ana_1')).toBe(true)
    expect(rules.username.validate?.('ana 1')).toBe(
      'Solo letras, números, punto, guion y guion bajo.',
    )
  })
})

describe('rules.rfc', () => {
  it('acepta un RFC válido y lo trata como opcional', () => {
    expect(rules.rfc.validate?.('ABCD123456XYZ')).toBe(true)
    expect(rules.rfc.validate?.(undefined)).toBe(true)
  })

  it('rechaza un RFC con formato inválido', () => {
    expect(rules.rfc.validate?.('123')).toBe('RFC inválido (12 o 13 caracteres).')
  })
})

describe('rules.fechaNoFutura', () => {
  it('rechaza fechas futuras', () => {
    expect(rules.fechaNoFutura.validate?.('2000-01-01')).toBe(true)
    expect(rules.fechaNoFutura.validate?.('2999-01-01')).toBe('La fecha no puede ser futura.')
  })
})

describe('rules.celular', () => {
  it('exige 10 dígitos cuando hay valor', () => {
    expect(rules.celular.validate?.('5512345678')).toBe(true)
    expect(rules.celular.validate?.('123')).toBe('Debe tener 10 dígitos.')
    expect(rules.celular.validate?.(undefined)).toBe(true)
  })
})
