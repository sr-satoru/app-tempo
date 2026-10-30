export interface CalendarDay {
  dayNumber: number
  dateString: string // "YYYY-MM-DD"
  dayOfWeek: string // "Seg", "Ter", etc.
  dayOfWeekFull: string
  isWeekend: boolean
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const WEEK_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const WEEK_DAYS_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

/**
 * Retorna se o ano é bissexto
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Gera todos os dias de um mês e ano específicos de forma 100% nativa e offline
 * @param year Ex: 2026
 * @param monthIndex 0 a 11 (0 = Janeiro, 11 = Dezembro)
 */
export function getDaysInMonth(year: number, monthIndex: number): CalendarDay[] {
  // O dia 0 do mês seguinte fornece o último dia do mês atual (28, 29, 30 ou 31)
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()
  const days: CalendarDay[] = []

  for (let day = 1; day <= totalDays; day++) {
    const curDate = new Date(year, monthIndex, day)
    const dayOfWeekIdx = curDate.getDay()
    const monthFormatted = String(monthIndex + 1).padStart(2, '0')
    const dayFormatted = String(day).padStart(2, '0')

    days.push({
      dayNumber: day,
      dateString: `${year}-${monthFormatted}-${dayFormatted}`,
      dayOfWeek: WEEK_DAYS_SHORT[dayOfWeekIdx],
      dayOfWeekFull: WEEK_DAYS_FULL[dayOfWeekIdx],
      isWeekend: dayOfWeekIdx === 0 || dayOfWeekIdx === 6,
    })
  }

  return days
}
