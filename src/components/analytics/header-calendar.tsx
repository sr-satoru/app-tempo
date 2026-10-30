import React from 'react'
import { Button } from '@/components/ui/button'
import { useCalendarContext } from '@/contexts/calendar-context'
import { useTheme } from '@/contexts/theme-context'
import { MONTH_NAMES } from '@/domain/calendar'

interface HeaderCalendarProps {
  onOpenExport: () => void
}

export const HeaderCalendar: React.FC<HeaderCalendarProps> = ({ onOpenExport }) => {
  const {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    goToCurrentMonth,
  } = useCalendarContext()
  const { theme, toggleTheme } = useTheme()

  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0B0C0E] px-6 py-2.5">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4 max-w-[1600px]">
        {/* Controle de Calendário Organizado e Limpo */}
        <div className="flex items-center gap-2">
          {/* Select de Mês */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-slate-50 dark:bg-[#121316] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-[#7C3AED]"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx} className="bg-white dark:bg-[#121316] text-slate-900 dark:text-white">
                {name}
              </option>
            ))}
          </select>

          {/* Select de Ano */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-slate-50 dark:bg-[#121316] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-[#7C3AED]"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-[#121316] text-slate-900 dark:text-white">
                {y}
              </option>
            ))}
          </select>

          {/* Botão Mês Atual */}
          <button
            type="button"
            onClick={goToCurrentMonth}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-slate-50 dark:bg-[#121316] text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A1C22] transition-colors cursor-pointer ml-1"
          >
            Mês Atual
          </button>
        </div>

        {/* Ações Direitas: Exportar e Tema */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            className="h-9 text-xs px-3.5 border-slate-200 dark:border-[#1E2025]"
          >
            Exportar Dados
          </Button>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center h-9 px-3 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#18191E] cursor-pointer transition-colors"
          >
            {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </div>
      </div>
    </header>
  )
}
