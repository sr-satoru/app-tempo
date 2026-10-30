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

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1E2025] bg-slate-50/60 dark:bg-[#16171D] text-slate-500 dark:text-slate-400 font-medium">
              <th className="py-3.5 px-4 w-20 text-center">Data</th>
              <th className="py-3.5 px-3 w-28">Horas Trab.</th>
              <th className="py-3.5 px-3 w-36">Faturamento</th>
              <th className="py-3.5 px-3 w-36">Gasto em Ads</th>
              <th className="py-3.5 px-3 w-36">Outros Custos</th>
              <th className="py-3.5 px-3 min-w-[200px]">Campanha / Notas</th>

              {/* Colunas de Resultado à Direita com Separação Limpa */}
              <th className="py-3.5 px-4 w-32 text-right border-l border-slate-200 dark:border-[#1E2025] text-slate-500 dark:text-slate-400 font-medium">
                Total Custos
              </th>
              <th className="py-3.5 px-4 w-36 text-right text-slate-500 dark:text-slate-400 font-medium">
                Lucro Líquido
              </th>
              <th className="py-3.5 px-4 w-28 text-right text-slate-500 dark:text-slate-400 font-medium">
                ROAS
              </th>
              <th className="py-3.5 px-4 w-28 text-right text-slate-500 dark:text-slate-400 font-medium">
                ROI %
              </th>
              <th className="py-3.5 px-5 w-40 text-right text-[#7C3AED] dark:text-[#A78BFA] font-semibold">
                Sua Hora (R$/h)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1A1C22]">
            {days.map((day) => {
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

              return (
                <tr
                  key={day.dateString}
                  className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-[#16171D] ${
                    isToday
                      ? 'bg-purple-50/30 dark:bg-[#7C3AED]/5 font-medium'
                      : day.isWeekend
                      ? 'bg-slate-50/20 dark:bg-[#101114]'
                      : ''
                  }`}
                >
                  {/* Data & Dia da Semana */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      <span
                        className={`text-xs ${
                          isToday
                            ? 'font-bold text-[#7C3AED] dark:text-[#A78BFA]'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {String(day.dayNumber).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {day.dayOfWeek}
                      </span>
                    </div>
                  </td>

                  {/* Horas - 100% editável */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0.0h"
                      value={entry.horasTrabalhadas || ''}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'horasTrabalhadas', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono transition-colors"
                    />
                  </td>

                  {/* Faturamento - 100% editável */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.faturamento || ''}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'faturamento', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Gasto em Ads - 100% editável */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.gastoAds || ''}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'gastoAds', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-rose-500 text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Outros Custos - 100% editável */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.outrosGastos || ''}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'outrosGastos', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Notas - 100% editável */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Campanha, BM..."
                      value={entry.observacoes || ''}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'observacoes', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-500 dark:text-slate-400 text-xs transition-colors"
                    />
                  </td>

                  {/* Tot Custos */}
                  <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-[#1E2025]">
                    {hasActivity ? formatCurrency(calc.totalGastos) : '—'}
                  </td>

                  {/* Lucro Líquido */}
                  <td
                    className={`py-3 px-4 text-right font-mono font-medium ${
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
                  <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                    {calc.roas > 0 ? `${calc.roas.toFixed(2)}x` : '—'}
                  </td>

                  {/* ROI % */}
                  <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                    {calc.roiPercent !== 0 ? formatPercent(calc.roiPercent) : '—'}
                  </td>

                  {/* ⭐ VALOR DA HORA HOJE */}
                  <td className="py-3 px-5 text-right font-mono font-semibold text-[#7C3AED] dark:text-[#C4B5FD]">
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
