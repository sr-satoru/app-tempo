import React from 'react'
import { formatCurrency } from '@/lib/utils'

export interface ChannelShareItem {
  channel: string
  faturamento: number
  color: string
}

interface DashboardChannelDonutProps {
  items: ChannelShareItem[]
  totalFaturamento: number
}

export const DashboardChannelDonut: React.FC<DashboardChannelDonutProps> = ({
  items,
  totalFaturamento,
}) => {
  const radius = 54
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius

  // Filtra itens com faturamento > 0 ou fornece fallback limpo
  const validItems = items.filter((it) => it.faturamento > 0)
  const displayItems =
    validItems.length > 0
      ? validItems
      : [
          { channel: 'TikTok', faturamento: 1, color: '#7C3AED' },
          { channel: 'Instagram', faturamento: 1, color: '#3B82F6' },
          { channel: 'Tráfego Pago', faturamento: 1, color: '#10B981' },
        ]

  const effectiveTotal = validItems.length > 0 ? totalFaturamento : 3

  // Calcula offsets para cada fatia circular
  let accumulatedPercent = 0
  const slices = displayItems.map((item) => {
    const percent = item.faturamento / (effectiveTotal || 1)
    const strokeDasharray = `${(percent * circumference).toFixed(2)} ${circumference.toFixed(2)}`
    const strokeDashoffset = (-accumulatedPercent * circumference).toFixed(2)
    accumulatedPercent += percent

    return {
      ...item,
      percent: percent * 100,
      strokeDasharray,
      strokeDashoffset,
    }
  })

  // Canal principal
  const topChannel = validItems.length > 0 ? validItems[0] : null

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm flex flex-col justify-between">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Atribuição por Canal
          </h3>
          <span className="text-xs text-slate-400 font-mono">Receita por fonte</span>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Divisão percentual entre redes sociais orgânicas e anúncios
        </p>

        {/* Donut e Legenda lado a lado */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
          {/* Donut SVG com Centro */}
          <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              {/* Círculo de Fundo */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-[#1C1E26]"
              />

              {/* Fatias do Donut */}
              {slices.map((slice, i) => (
                <circle
                  key={i}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              ))}
            </svg>

            {/* Conteúdo Central do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[11px] text-slate-400 font-medium">Total</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
                {totalFaturamento >= 1000
                  ? `R$ ${(totalFaturamento / 1000).toFixed(1)}k`
                  : formatCurrency(totalFaturamento)}
              </span>
              <span className="text-[9px] text-[#7C3AED] dark:text-[#C4B5FD] font-semibold mt-0.5">
                Atribuído
              </span>
            </div>
          </div>

          {/* Legenda com Valores e % */}
          <div className="flex-1 w-full space-y-2">
            {slices.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-[#1E2028] last:border-none"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                    {item.channel}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 font-mono">
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {validItems.length > 0 ? formatCurrency(item.faturamento) : '—'}
                  </span>
                  <span className="text-[11px] text-slate-400 w-8 text-right">
                    {validItems.length > 0 ? `${item.percent.toFixed(0)}%` : '0%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Callout Footer estilo Dribbble / Imagem de Referência */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2028] flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="text-[#7C3AED] text-sm">✨</span>
        <span className="leading-snug">
          {topChannel ? (
            <>
              <strong>{topChannel.channel}</strong> é o principal canal, representando{' '}
              <strong className="text-[#7C3AED] dark:text-[#C4B5FD]">
                {((topChannel.faturamento / (totalFaturamento || 1)) * 100).toFixed(0)}%
              </strong>{' '}
              da sua receita este mês.
            </>
          ) : (
            'Cadastre lançamentos nas modelos e BMs para visualizar a atribuição detalhada.'
          )}
        </span>
      </div>
    </div>
  )
}
