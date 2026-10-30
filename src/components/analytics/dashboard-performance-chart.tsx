import React, { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'

export interface DailyDataPoint {
  dayNumber: number
  dateString: string
  faturamento: number
  custos: number
  lucro: number
  horas: number
  valorHora: number
}

interface DashboardPerformanceChartProps {
  data: DailyDataPoint[]
}

function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export const DashboardPerformanceChart: React.FC<DashboardPerformanceChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const W = 740, H = 230, PL = 52, PR = 16, PT = 16, PB = 32
  const UW = W - PL - PR
  const UH = H - PT - PB

  const maxVal = useMemo(() => {
    const highest = Math.max(...data.map((d) => Math.max(d.faturamento, d.lucro, 0)), 100)
    return Math.ceil(highest * 1.2)
  }, [data])

  const stepX = data.length > 1 ? UW / (data.length - 1) : 0

  const fatPts = data.map((d, i) => ({
    x: PL + i * stepX,
    y: PT + UH - (Math.max(0, d.faturamento) / maxVal) * UH,
  }))
  const lucroPts = data.map((d, i) => ({
    x: PL + i * stepX,
    y: PT + UH - (Math.max(0, d.lucro) / maxVal) * UH,
  }))

  const fatPath = useMemo(() => generateSmoothPath(fatPts), [fatPts])
  const lucroPath = useMemo(() => generateSmoothPath(lucroPts), [lucroPts])

  const fatArea = useMemo(() => {
    if (!fatPts.length) return ''
    const base = PT + UH
    return `${fatPath} L ${fatPts[fatPts.length - 1].x} ${base} L ${fatPts[0].x} ${base} Z`
  }, [fatPath, fatPts])

  const lucroArea = useMemo(() => {
    if (!lucroPts.length) return ''
    const base = PT + UH
    return `${lucroPath} L ${lucroPts[lucroPts.length - 1].x} ${base} L ${lucroPts[0].x} ${base} Z`
  }, [lucroPath, lucroPts])

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((f) => maxVal * f)

  const xTickIndices = useMemo(() => {
    if (data.length <= 7) return data.map((_, i) => i)
    const result = [0]
    for (let i = 6; i < data.length - 1; i += 7) result.push(i)
    result.push(data.length - 1)
    return [...new Set(result)]
  }, [data])

  const hd = hoveredIndex !== null ? data[hoveredIndex] : null
  const hp = hoveredIndex !== null ? fatPts[hoveredIndex] : null
  const barW = Math.max(4, Math.min(14, UW / (data.length * 1.6)))

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
            Desempenho da Operação
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Faturamento e retorno líquido — acumulado diário do mês
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-[2.5px] rounded-full bg-indigo-500 inline-block" />
            <span>Faturamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-[2.5px] rounded-full bg-emerald-500 inline-block" />
            <span>Lucro Líquido</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="perfFatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="perfLucroGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="perfBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {yTicks.map((val, i) => {
            const y = PT + UH - (val / maxVal) * UH
            return (
              <g key={i}>
                <line
                  x1={PL} y1={y} x2={W - PR} y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#1A1C24]"
                  strokeWidth="1"
                />
                <text
                  x={PL - 6} y={y + 3.5}
                  textAnchor="end"
                  fontSize="9"
                  className="fill-slate-400"
                  fontFamily="ui-monospace,monospace"
                >
                  {val >= 1000 ? `R$${(val / 1000).toFixed(0)}k` : `R$${val.toFixed(0)}`}
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const p = fatPts[i]
            if (!p) return null
            const bh = Math.max(2, UH - (p.y - PT))
            const isHov = hoveredIndex === i
            return (
              <rect
                key={i}
                x={p.x - barW / 2}
                y={p.y}
                width={barW}
                height={bh}
                rx={barW / 3}
                fill={isHov ? '#818CF8' : 'url(#perfBarGrad)'}
                opacity={isHov ? 0.7 : 1}
                className="transition-all duration-150"
              />
            )
          })}

          <path d={fatArea} fill="url(#perfFatGrad)" />
          <path d={lucroArea} fill="url(#perfLucroGrad)" />

          <path
            d={fatPath}
            fill="none"
            stroke="#6366F1"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={lucroPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hp && (
            <line
              x1={hp.x} y1={PT}
              x2={hp.x} y2={PT + UH}
              stroke="#6366F1"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.45"
            />
          )}

          {data.map((_, i) => {
            const pf = fatPts[i]
            const pl = lucroPts[i]
            if (!pf) return null
            const isHov = hoveredIndex === i
            const colW = UW / Math.max(data.length, 1)
            return (
              <g key={i}>
                <rect
                  x={pf.x - colW / 2}
                  y={PT}
                  width={colW}
                  height={UH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
                {isHov && (
                  <>
                    <circle cx={pf.x} cy={pf.y} r="4.5" fill="#6366F1" />
                    <circle cx={pf.x} cy={pf.y} r="2" fill="#fff" />
                    {pl && (
                      <>
                        <circle cx={pl.x} cy={pl.y} r="4" fill="#10B981" />
                        <circle cx={pl.x} cy={pl.y} r="1.75" fill="#fff" />
                      </>
                    )}
                  </>
                )}
              </g>
            )
          })}

          {xTickIndices.map((idx) => {
            const d = data[idx]
            const p = fatPts[idx]
            if (!d || !p) return null
            return (
              <text
                key={idx}
                x={p.x}
                y={H - 8}
                textAnchor="middle"
                fontSize="9"
                className="fill-slate-400"
                fontFamily="ui-monospace,monospace"
              >
                {d.dateString.slice(8, 10)}/{d.dateString.slice(5, 7)}
              </text>
            )
          })}
        </svg>

        {hd && hp && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-slate-100 dark:border-[#22242D] bg-white dark:bg-[#16171D] p-3 shadow-xl text-xs"
            style={{
              left: `${Math.min(Math.max(5, (hp.x / W) * 100 - 8), 68)}%`,
              top: '8px',
              minWidth: '162px',
            }}
          >
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 pb-1.5 border-b border-slate-100 dark:border-[#22242D] font-mono flex items-center justify-between">
              <span>{hd.dateString.slice(8, 10)}/{hd.dateString.slice(5, 7)}</span>
              {hd.horas > 0 && (
                <span className="text-indigo-500 text-[10px]">{formatCurrency(hd.valorHora)}/h</span>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                  Faturamento
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-white">
                  {formatCurrency(hd.faturamento)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                  Custos
                </span>
                <span className="font-mono font-semibold text-rose-500">
                  {formatCurrency(hd.custos)}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 dark:border-[#22242D]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Lucro
                </span>
                <span className={`font-mono font-bold ${hd.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(hd.lucro)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
