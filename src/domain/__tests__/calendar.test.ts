import { describe, it, expect } from 'vitest'
import { getDaysInMonth, isLeapYear } from '../calendar'

describe('Motor de Calendário Nativo e Anos Bissextos', () => {
  it('deve identificar corretamente anos bissextos', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2026)).toBe(false)
    expect(isLeapYear(2028)).toBe(true)
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)
  })

  it('deve gerar 29 dias para Fevereiro em ano bissexto (2024)', () => {
    const days = getDaysInMonth(2024, 1) // 1 = Fevereiro
    expect(days).toHaveLength(29)
    expect(days[0].dayNumber).toBe(1)
    expect(days[28].dayNumber).toBe(29)
    expect(days[28].dateString).toBe('2024-02-29')
  })

  it('deve gerar 28 dias para Fevereiro em ano não bissexto (2026)', () => {
    const days = getDaysInMonth(2026, 1)
    expect(days).toHaveLength(28)
  })

  it('deve gerar 31 dias para Janeiro e 30 dias para Abril', () => {
    const jan = getDaysInMonth(2026, 0)
    expect(jan).toHaveLength(31)

    const abr = getDaysInMonth(2026, 3)
    expect(abr).toHaveLength(30)
  })
})
