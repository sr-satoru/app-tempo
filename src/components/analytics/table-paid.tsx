import React from 'react'
import { CalendarDay } from '@/domain/calendar'
import { calculatePaidDaily } from '@/domain/calculations'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { PaidDailyEntry } from '@/types/analytics'

interface TablePaidProps {
  days: CalendarDay[]
  entries: PaidDailyEntry[]
  selectedProfileId: string
  onSaveEntry: (entry: PaidDailyEntry) => Promise<void>
}

export const TablePaid: React.FC<TablePaidProps> = ({
  days,
  entries,
  selectedProfileId,
  onSaveEntry,
}) => {
  const todayStr = new Date().toISOString().split('T')[0]

  const entriesMap = React.useMemo(() => {
    const map = new Map<string, PaidDailyEntry>()
    entries.forEach((e) => map.set(e.data, e))
    return map
  }, [entries])

  const handleFieldChange = (
    dateString: string,
    field: keyof PaidDailyEntry,
    value: string | number
  ) => {
    const existing = entriesMap.get(dateString) || {
      id: `${dateString}_${selectedProfileId}`,
      data: dateString,
      profileId: selectedProfileId,
      horasTrabalhadas: 0,
      faturamento: 0,
      gastoAds: 0,
      outrosGastos: 0,
      observacoes: '',
    }

    const updated = {
      ...existing,
      profileId: selectedProfileId,
      [field]: typeof existing[field] === 'number' ? Number(value) || 0 : value,
    }

    onSaveEntry(updated)
  }

  // Previne alteração acidental de valores ao rolar o scroll do mouse
  const handlePreventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur()
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1E2025] bg-slate-50/80 dark:bg-[#16171D] text-slate-500 dark:text-slate-400 font-medium select-none text-[11px]">
              <th className="py-1.5 px-2 w-16 text-center">Data</th>
              <th className="py-1.5 px-2 w-20 text-right">Horas Trab.</th>
              <th className="py-1.5 px-2 w-28 text-right">Faturamento</th>
              <th className="py-1.5 px-2 w-28 text-right">Gasto em Ads</th>
              <th className="py-1.5 px-2 w-28 text-right">Outros Custos</th>
              <th className="py-1.5 px-2 min-w-[160px]">Campanha / Notas</th>

              {/* Colunas de Resultado à Direita com Separação Limpa */}
              <th className="py-1.5 px-2.5 w-24 text-right border-l border-slate-200 dark:border-[#1E2025]">
                Total Custos
              </th>
              <th className="py-1.5 px-2.5 w-28 text-right">
                Lucro Líquido
              </th>
              <th className="py-1.5 px-2 w-16 text-right">
                ROAS
              </th>
              <th className="py-1.5 px-2 w-16 text-right">
                ROI %
              </th>
              <th className="py-1.5 px-3 w-28 text-right text-[#7C3AED] dark:text-[#A78BFA] font-semibold">
                Sua Hora (R$/h)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E2025]">
            {days.map((day, index) => {
              const entry = entriesMap.get(day.dateString) || {
                id: `${day.dateString}_${selectedProfileId}`,
                data: day.dateString,
                profileId: selectedProfileId,
                horasTrabalhadas: 0,
                faturamento: 0,
                gastoAds: 0,
                outrosGastos: 0,
              }

              const calc = calculatePaidDaily(entry)
              const isToday = day.dateString === todayStr
              const isProfitPositive = calc.lucroLiquido >= 0
              const hasActivity =
                entry.horasTrabalhadas > 0 ||
                entry.faturamento > 0 ||
                calc.totalGastos > 0
              const isEven = index % 2 === 0

              return (
                <tr
                  key={day.dateString}
                  className={`h-7 transition-colors hover:bg-purple-50/70 dark:hover:bg-[#252834] ${
                    isToday
                      ? 'bg-purple-100/90 dark:bg-[#7C3AED]/25 font-medium'
                      : isEven
                      ? 'bg-white dark:bg-[#0E0F12]'
                      : 'bg-[#F1F5F9] dark:bg-[#1A1C24]'
                  }`}
                >
                  {/* Data & Dia da Semana */}
                  <td className="py-0.5 px-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 font-mono">
                      <span
                        className={`text-xs ${
                          isToday
                            ? 'font-bold text-[#7C3AED] dark:text-[#A78BFA]'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {String(day.dayNumber).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {day.dayOfWeek}
                      </span>
                    </div>
                  </td>

                  {/* Horas - sem scroll acidental */}
                  <td className="p-0.5 px-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0.0h"
                      value={entry.horasTrabalhadas || ''}
                      onWheel={handlePreventWheelChange}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'horasTrabalhadas', e.target.value)
                      }
                      className="w-full h-6.5 rounded px-2 bg-transparent hover:bg-white dark:hover:bg-[#22242D] focus:bg-white dark:focus:bg-[#22242D] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono transition-colors"
                    />
                  </td>

                  {/* Faturamento - sem scroll acidental */}
                  <td className="p-0.5 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.faturamento || ''}
                      onWheel={handlePreventWheelChange}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'faturamento', e.target.value)
                      }
                      className="w-full h-6.5 rounded px-2 bg-transparent hover:bg-white dark:hover:bg-[#22242D] focus:bg-white dark:focus:bg-[#22242D] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Gasto em Ads - sem scroll acidental */}
                  <td className="p-0.5 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.gastoAds || ''}
                      onWheel={handlePreventWheelChange}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'gastoAds', e.target.value)
                      }
                      className="w-full h-6.5 rounded px-2 bg-transparent hover:bg-white dark:hover:bg-[#22242D] focus:bg-white dark:focus:bg-[#22242D] border border-transparent focus:border-[#7C3AED] text-rose-500 text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Outros Custos - sem scroll acidental */}
                  <td className="p-0.5 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.outrosGastos || ''}
                      onWheel={handlePreventWheelChange}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'outrosGastos', e.target.value)
                      }
                      className="w-full h-6.5 rounded px-2 bg-transparent hover:bg-white dark:hover:bg-[#22242D] focus:bg-white dark:focus:bg-[#22242D] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Notas */}
                  <td className="p-0.5 px-1">
                    <input
                      type="text"
                      placeholder="Campanha, BM..."
                      value={entry.observacoes || ''}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'observacoes', e.target.value)
                      }
                      className="w-full h-6.5 rounded px-2 bg-transparent hover:bg-white dark:hover:bg-[#22242D] border border-transparent focus:border-[#7C3AED] text-slate-500 dark:text-slate-400 text-xs transition-colors"
                    />
                  </td>

                  {/* Tot Custos */}
                  <td className="py-1 px-2 text-right font-mono text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-[#1E2025]">
                    {hasActivity ? formatCurrency(calc.totalGastos) : '—'}
                  </td>

                  {/* Lucro Líquido */}
                  <td
                    className={`py-1 px-2 text-right font-mono text-xs font-medium ${
                      !hasActivity
                        ? 'text-slate-400 dark:text-slate-600'
                        : isProfitPositive
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {hasActivity ? formatCurrency(calc.lucroLiquido) : '—'}
                  </td>

                  {/* ROAS */}
                  <td className="py-1 px-2 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                    {calc.roas > 0 ? `${calc.roas.toFixed(2)}x` : '—'}
                  </td>

                  {/* ROI % */}
                  <td className="py-1 px-2 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                    {calc.roiPercent !== 0 ? formatPercent(calc.roiPercent) : '—'}
                  </td>

                  {/* ⭐ VALOR DA HORA HOJE */}
                  <td className="py-1 px-2.5 text-right font-mono text-xs font-semibold text-[#7C3AED] dark:text-[#C4B5FD]">
                    {entry.horasTrabalhadas > 0 ? (
                      <span className={calc.valorHoraHoje >= 0 ? 'text-[#7C3AED] dark:text-[#C4B5FD]' : 'text-rose-500'}>
                        {formatCurrency(calc.valorHoraHoje)}/h
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700 font-normal">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
