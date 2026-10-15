import { describe, expect, it } from 'vitest'
import { formatDate, trim, trimOrNull } from '@/utils/format'

describe('trim', () => {
  it('recorta los espacios de los extremos', () => {
    expect(trim('  hola  ')).toBe('hola')
  })

  it('devuelve cadena vacía para null o undefined', () => {
    expect(trim(null)).toBe('')
    expect(trim(undefined)).toBe('')
  })
})

describe('trimOrNull', () => {
  it('convierte vacío o solo espacios en null', () => {
    expect(trimOrNull('   ')).toBeNull()
    expect(trimOrNull('')).toBeNull()
    expect(trimOrNull(null)).toBeNull()
    expect(trimOrNull(undefined)).toBeNull()
  })

  it('recorta los valores con contenido', () => {
    expect(trimOrNull('  valor ')).toBe('valor')
  })
})

describe('formatDate', () => {
  it('devuelve guion para valores vacíos o inválidos', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('no-es-fecha')).toBe('—')
  })

  it('formatea una fecha válida como dd/mm/aaaa', () => {
    expect(formatDate('2024-03-05')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })
})
