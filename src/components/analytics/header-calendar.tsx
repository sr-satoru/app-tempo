import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCalendarContext } from '@/contexts/calendar-context'
import { useTheme } from '@/contexts/theme-context'
import { MONTH_NAMES, isLeapYear } from '@/domain/calendar'

interface HeaderCalendarProps {
  onOpenExport: () => void
}

export const HeaderCalendar: React.FC<HeaderCalendarProps> = ({ onOpenExport }) => {
  const {
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useCalendarContext()
  const { theme, toggleTheme } = useTheme()

  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030]
  const leap = isLeapYear(selectedYear)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-[#1E2025] bg-white/95 dark:bg-[#0B0C0E]/95 backdrop-blur-md px-6 py-3 transition-colors">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-6 max-w-[1600px]">
        {/* Marca Minimalista */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
            OpAnalytics
          </span>
          <span className="text-slate-300 dark:text-[#2A2D35]">/</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            OFM & Tráfego Pago
          </span>
        </div>

        {/* Seletor de Calendário Minimalista e Espaçoso */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-slate-50/50 dark:bg-[#121316] p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            title="Mês anterior"
            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="h-8 bg-transparent px-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx} className="bg-white dark:bg-[#121316]">
                {name}
              </option>
            ))}
          </select>

          <span className="text-slate-300 dark:text-[#2A2D35] px-0.5">·</span>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-8 bg-transparent px-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-[#121316]">
                {y} {isLeapYear(y) ? '(Bissexto)' : ''}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            title="Próximo mês"
            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="h-7 text-[11px] px-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white ml-1"
          >
            Mês Atual
          </Button>
        </div>

        {/* Ações Direitas Limpas */}
        <div className="flex items-center gap-3">
          {leap && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
              Ano Bissexto
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenExport}
            className="text-xs h-8 px-3 rounded-lg border-slate-200 dark:border-[#1E2025]"
          >
            Exportar
          </Button>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#18191E] cursor-pointer transition-colors"
          >
            {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </div>
      </div>
    </header>
  )
}
