import React from 'react'
import { CalendarDay } from '@/domain/calendar'
import { calculateOrganicDaily } from '@/domain/calculations'
import { formatCurrency } from '@/lib/utils'
import type { OrganicDailyEntry } from '@/types/analytics'

interface TableOrganicProps {
  days: CalendarDay[]
  entries: OrganicDailyEntry[]
  selectedModelId: string
  onSaveEntry: (entry: OrganicDailyEntry) => Promise<void>
}

const CHANNELS = ['TikTok', 'Instagram', 'Reddit', 'X (Twitter)', 'Tinder/Bumble', 'Geral/Misto']

export const TableOrganic: React.FC<TableOrganicProps> = ({
  days,
  entries,
  selectedModelId,
  onSaveEntry,
}) => {
  const todayStr = new Date().toISOString().split('T')[0]

  const entriesMap = React.useMemo(() => {
    const map = new Map<string, OrganicDailyEntry>()
    entries.forEach((e) => map.set(e.data, e))
    return map
  }, [entries])

  const handleFieldChange = (
    dateString: string,
    field: keyof OrganicDailyEntry,
    value: string | number
  ) => {
    const existing = entriesMap.get(dateString) || {
      id: `${dateString}_${selectedModelId}`,
      data: dateString,
      modeloId: selectedModelId,
      canalRedeSocial: 'TikTok',
      horasTrabalhadas: 0,
      faturamento: 0,
      custoReposicaoContas: 0,
      qtdContasRepostas: 0,
      outrosCustosContingencia: 0,
      observacoes: '',
    }

    const updated = {
      ...existing,
      modeloId: selectedModelId,
      [field]: typeof existing[field] === 'number' ? Number(value) || 0 : value,
    }

    onSaveEntry(updated)
  }

  // Previne alteração acidental de valores numéricos via scroll do mouse
  const handlePreventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur()
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
              <th className="py-3.5 px-3 w-36">Canal / Rede</th>
              <th className="py-3.5 px-3 w-36">Reposição Contas</th>
              <th className="py-3.5 px-3 w-28 text-center">Contas Rep.</th>
              <th className="py-3.5 px-3 w-36">Proxies & Chips</th>
              <th className="py-3.5 px-3 min-w-[200px]">Observações</th>

              {/* Colunas de Resultado à Direita com Separação Limpa */}
              <th className="py-3.5 px-4 w-32 text-right border-l border-slate-200 dark:border-[#1E2025] text-slate-500 dark:text-slate-400 font-medium">
                Contingência
              </th>
              <th className="py-3.5 px-4 w-28 text-right text-slate-500 dark:text-slate-400 font-medium">
                Méd/Conta
              </th>
              <th className="py-3.5 px-4 w-36 text-right text-slate-500 dark:text-slate-400 font-medium">
                Lucro Líquido
              </th>
              <th className="py-3.5 px-5 w-40 text-right text-[#7C3AED] dark:text-[#A78BFA] font-semibold">
                Sua Hora (R$/h)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1A1C22]">
            {days.map((day) => {
              const entry = entriesMap.get(day.dateString) || {
                id: `${day.dateString}_${selectedModelId}`,
                data: day.dateString,
                modeloId: selectedModelId,
                canalRedeSocial: 'TikTok',
                horasTrabalhadas: 0,
                faturamento: 0,
                custoReposicaoContas: 0,
                qtdContasRepostas: 0,
                outrosCustosContingencia: 0,
              }

              const calc = calculateOrganicDaily(entry)
              const isToday = day.dateString === todayStr
              const isProfitPositive = calc.lucroLiquido >= 0
              const hasActivity =
                entry.horasTrabalhadas > 0 ||
                entry.faturamento > 0 ||
                calc.totalContingencia > 0

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

                  {/* Horas - sem scroll acidental */}
                  <td className="py-2 px-2">
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
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono transition-colors"
                    />
                  </td>

                  {/* Faturamento - sem scroll acidental */}
                  <td className="py-2 px-2">
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
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Canal Social */}
                  <td className="py-2 px-2">
                    <select
                      value={entry.canalRedeSocial || 'TikTok'}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'canalRedeSocial', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2 text-xs bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {CHANNELS.map((ch) => (
                        <option key={ch} value={ch} className="bg-white dark:bg-[#16171E]">
                          {ch}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Custo Reposição Contas - sem scroll acidental */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.custoReposicaoContas || ''}
                      onWheel={handlePreventWheelChange}
                      onChange={(e) =>
                        handleFieldChange(
                          day.dateString,
                          'custoReposicaoContas',
                          e.target.value
                        )
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-rose-500 text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Qtd Contas Repostas - sem scroll acidental */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={entry.qtdContasRepostas || ''}
                      onWheel={handlePreventWheelChange}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'qtdContasRepostas', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-center font-mono transition-colors"
                    />
                  </td>

                  {/* Outros Custos Contingência - sem scroll acidental */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="R$ 0,00"
                      value={entry.outrosCustosContingencia || ''}
                      onWheel={handlePreventWheelChange}
                      onChange={(e) =>
                        handleFieldChange(
                          day.dateString,
                          'outrosCustosContingencia',
                          e.target.value
                        )
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] focus:bg-white dark:focus:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-900 dark:text-white text-xs text-right font-mono tabular-nums transition-colors"
                    />
                  </td>

                  {/* Notas */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Anotações..."
                      value={entry.observacoes || ''}
                      onChange={(e) =>
                        handleFieldChange(day.dateString, 'observacoes', e.target.value)
                      }
                      className="w-full h-8 rounded-lg px-2.5 bg-slate-50/50 dark:bg-[#16171E] hover:bg-white dark:hover:bg-[#1A1C24] border border-transparent focus:border-[#7C3AED] text-slate-500 dark:text-slate-400 text-xs transition-colors"
                    />
                  </td>

                  {/* --- Resultados Calculados --- */}

                  {/* Total Contingência */}
                  <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-[#1E2025]">
                    {hasActivity ? formatCurrency(calc.totalContingencia) : '—'}
                  </td>

                  {/* Custo Médio por Conta */}
                  <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                    {calc.custoMedioPorConta > 0 ? formatCurrency(calc.custoMedioPorConta) : '—'}
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
