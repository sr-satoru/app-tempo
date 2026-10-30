import React, { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

function fmtCompact(val: number): string {
  if (val >= 1_000_000_000) return `R$${(val / 1_000_000_000).toFixed(1)}B`
  if (val >= 1_000_000) return `R$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`
  return formatCurrency(val)
}

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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const radius = 52
  const strokeWidth = 13
  const circumference = 2 * Math.PI * radius

  const validItems = items.filter((it) => it.faturamento > 0)
  const displayItems =
    validItems.length > 0
      ? validItems
      : [
          { channel: 'TikTok', faturamento: 1, color: '#6366F1' },
          { channel: 'Instagram', faturamento: 1, color: '#3B82F6' },
          { channel: 'Tráfego Pago', faturamento: 1, color: '#10B981' },
        ]

  const effectiveTotal = validItems.length > 0 ? Math.max(totalFaturamento, 1) : 3

  let acc = 0
  const slices = displayItems.map((item, i) => {
    const pct = item.faturamento / effectiveTotal
    const dashArray = `${(pct * circumference).toFixed(2)} ${circumference.toFixed(2)}`
    const dashOffset = (-acc * circumference).toFixed(2)
    acc += pct
    return { ...item, pct: pct * 100, dashArray, dashOffset, idx: i }
  })

  const topChannel = validItems[0] ?? null

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12] p-5 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Atribuição por Canal
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Receita por fonte →</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Divisão entre redes sociais orgânicas e anúncios
        </p>
      </div>

      {/* Donut + Legend — exactly like reference image */}
      <div className="flex items-center gap-5 flex-1">
        {/* Donut */}
        <div className="relative w-[120px] h-[120px] flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-[#1A1C24]"
            />
            {slices.map((s) => (
              <circle
                key={s.idx}
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={hoveredIdx === s.idx ? strokeWidth + 2.5 : strokeWidth}
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(s.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-2">
            <span className="text-[9px] text-slate-400 leading-none">Total</span>
            <span className="text-[10px] font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-tight mt-0.5 truncate max-w-[70px] block">
              {totalFaturamento >= 1_000_000_000
                ? `R$${(totalFaturamento / 1_000_000_000).toFixed(1)}B`
                : totalFaturamento >= 1_000_000
                ? `R$${(totalFaturamento / 1_000_000).toFixed(1)}M`
                : totalFaturamento >= 1000
                ? `R$${(totalFaturamento / 1000).toFixed(1)}k`
                : formatCurrency(totalFaturamento)}
            </span>
            <span className="text-[9px] text-indigo-500 font-semibold mt-0.5">Atribuído</span>
          </div>
        </div>

        {/* Legend — styled exactly like the reference */}
        <div className="flex-1 space-y-2 min-w-0">
          {slices.map((item) => (
            <div
              key={item.idx}
              className={`flex items-center justify-between text-xs py-0.5 cursor-default transition-opacity duration-200 ${
                hoveredIdx !== null && hoveredIdx !== item.idx ? 'opacity-40' : 'opacity-100'
              }`}
              onMouseEnter={() => setHoveredIdx(item.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate text-[11px]">
                  {item.channel}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono font-semibold text-slate-900 dark:text-white text-[11px]">
                  {validItems.length > 0 ? fmtCompact(item.faturamento) : '—'}
                </span>
                <span
                  className="text-[10px] text-slate-400 font-mono w-8 text-right"
                  style={{ color: hoveredIdx === item.idx ? item.color : undefined }}
                >
                  {validItems.length > 0 ? `${item.pct.toFixed(0)}%` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer callout */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2025] text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <span className="text-indigo-400 flex-shrink-0 mt-px">✦</span>
        <span className="leading-snug">
          {topChannel ? (
            <>
              <strong className="text-slate-700 dark:text-slate-300">{topChannel.channel}</strong>{' '}
              é o principal canal, representando{' '}
              <strong style={{ color: topChannel.color }}>
                {((topChannel.faturamento / (totalFaturamento || 1)) * 100).toFixed(0)}%
              </strong>{' '}
              da receita.
            </>
          ) : (
            'Cadastre lançamentos para visualizar a atribuição por canal.'
          )}
        </span>
      </div>
    </div>
  )
}
