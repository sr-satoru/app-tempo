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

// Gera curva Bézier suave entre pontos
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

  const chartWidth = 740
  const chartHeight = 220
  const padLeft = 45
  const padRight = 20
  const padTop = 20
  const padBottom = 35

  const usableWidth = chartWidth - padLeft - padRight
  const usableHeight = chartHeight - padTop - padBottom

  // Máximo para escala Y
  const maxVal = useMemo(() => {
    const highest = Math.max(
      ...data.map((d) => Math.max(d.faturamento, d.custos, d.lucro, 0)),
      100
    )
    return Math.ceil(highest * 1.15)
  }, [data])

  // Coordenadas dos pontos
  const points = useMemo(() => {
    if (data.length === 0) return { faturamento: [], lucro: [], custos: [] }
    const step = data.length > 1 ? usableWidth / (data.length - 1) : 0

    const faturamento = data.map((d, i) => ({
      x: padLeft + i * step,
      y: padTop + usableHeight - (d.faturamento / maxVal) * usableHeight,
    }))

    const lucro = data.map((d, i) => ({
      x: padLeft + i * step,
      y: padTop + usableHeight - (Math.max(0, d.lucro) / maxVal) * usableHeight,
    }))

    const custos = data.map((d, i) => ({
      x: padLeft + i * step,
      y: padTop + usableHeight - (d.custos / maxVal) * usableHeight,
    }))

    return { faturamento, lucro, custos }
  }, [data, maxVal, usableWidth, usableHeight, padLeft, padTop])

  const faturamentoPath = useMemo(() => generateSmoothPath(points.faturamento), [points.faturamento])
  const lucroPath = useMemo(() => generateSmoothPath(points.lucro), [points.lucro])

  // Linha de área com gradiente preenchido
  const faturamentoArea = useMemo(() => {
    if (points.faturamento.length === 0) return ''
    const baseLine = padTop + usableHeight
    const firstX = points.faturamento[0].x
    const lastX = points.faturamento[points.faturamento.length - 1].x
    return `${faturamentoPath} L ${lastX} ${baseLine} L ${firstX} ${baseLine} Z`
  }, [faturamentoPath, points.faturamento, padTop, usableHeight])

  // Labels no eixo Y (4 linhas)
  const yTicks = [0, maxVal * 0.33, maxVal * 0.66, maxVal]

  // Selecionar dias para exibir no eixo X (ex: 01, 05, 10, 15, 20, 25, final)
  const xTickIndices = useMemo(() => {
    if (data.length <= 7) return data.map((_, i) => i)
    const indices = [0]
    for (let i = 4; i < data.length - 1; i += 5) {
      indices.push(i)
    }
    indices.push(data.length - 1)
    return indices
  }, [data])

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null
  const hoveredPoint = hoveredIndex !== null ? points.faturamento[hoveredIndex] : null

  return (
    <div className="relative rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
      {/* Cabeçalho do Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Desempenho da Operação
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-[#7C3AED]/15 text-[#7C3AED] dark:text-[#C4B5FD]">
              Consolidado
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Faturamento diário, volume de custos e retorno líquido
          </p>
        </div>

        {/* Legenda Customizada igual à imagem */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Faturamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Lucro Líquido</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-200/60 dark:bg-purple-900/40" />
            <span className="text-slate-400 font-normal">Volume Diário</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Interativo */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Gradiente da Área de Faturamento */}
            <linearGradient id="faturamentoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
              <stop offset="90%" stopColor="#7C3AED" stopOpacity="0.01" />
            </linearGradient>

            {/* Gradiente das barras verticais */}
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade Horizontais */}
          {yTicks.map((val, idx) => {
            const y = padTop + usableHeight - (val / maxVal) * usableHeight
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#1C1E25]"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono tabular-nums"
                >
                  {val >= 1000 ? `R$ ${(val / 1000).toFixed(0)}k` : `R$ ${val.toFixed(0)}`}
                </text>
              </g>
            )
          })}

          {/* Barras Verticais de Volume (Estilo Gráfico da Imagem) */}
          {data.map((d, i) => {
            const p = points.faturamento[i]
            if (!p) return null
            const barWidth = Math.max(6, Math.min(16, usableWidth / (data.length * 1.8)))
            const barHeight = Math.max(3, usableHeight - (p.y - padTop))
            const isHovered = hoveredIndex === i

            return (
              <rect
                key={i}
                x={p.x - barWidth / 2}
                y={p.y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 3}
                fill="url(#barGradient)"
                className={`transition-opacity duration-200 ${
                  isHovered ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
              />
            )
          })}

          {/* Área com Gradiente Suave */}
          <path d={faturamentoArea} fill="url(#faturamentoGradient)" />

          {/* Linha 1: Faturamento (Roxo Vibrante) */}
          <path
            d={faturamentoPath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Linha 2: Lucro Líquido (Verde Esmeralda) */}
          <path
            d={lucroPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Linha vertical indicadora no hover */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padTop}
              x2={hoveredPoint.x}
              y2={padTop + usableHeight}
              stroke="#7C3AED"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="opacity-70"
            />
          )}

          {/* Pontos Interativos com Mouse Trigger invisível */}
          {data.map((_, i) => {
            const pf = points.faturamento[i]
            const pl = points.lucro[i]
            if (!pf) return null
            const isHovered = hoveredIndex === i
            const colWidth = usableWidth / data.length

            return (
              <g key={i}>
                {/* Hitbox Invisível para Hover Fácil */}
                <rect
                  x={pf.x - colWidth / 2}
                  y={padTop}
                  width={colWidth}
                  height={usableHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />

                {/* Bolinha de Faturamento no Hover */}
                {isHovered && (
                  <>
                    <circle cx={pf.x} cy={pf.y} r="5" fill="#7C3AED" className="drop-shadow-md" />
                    <circle cx={pf.x} cy={pf.y} r="2" fill="#FFFFFF" />

                    {pl && (
                      <>
                        <circle cx={pl.x} cy={pl.y} r="4.5" fill="#10B981" className="drop-shadow-md" />
                        <circle cx={pl.x} cy={pl.y} r="1.75" fill="#FFFFFF" />
                      </>
                    )}
                  </>
                )}
              </g>
            )
          })}

          {/* Eixo X: Labels de Dias */}
          {xTickIndices.map((idx) => {
            const d = data[idx]
            const p = points.faturamento[idx]
            if (!d || !p) return null
            return (
              <text
                key={idx}
                x={p.x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-mono select-none"
              >
                Dia {String(d.dayNumber).padStart(2, '0')}
              </text>
            )
          })}
        </svg>

        {/* Tooltip Flutuante estilo Fintech/Linear */}
        {hoveredData && hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-slate-200 dark:border-[#22242D] bg-white/95 dark:bg-[#181920]/95 p-3 shadow-xl backdrop-blur-md transition-all duration-100"
            style={{
              left: `${Math.min(
                Math.max(10, (hoveredPoint.x / chartWidth) * 100),
                75
              )}%`,
              top: '12px',
            }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-[#252833] pb-1.5 mb-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-white font-mono">
                Dia {String(hoveredData.dayNumber).padStart(2, '0')} ({hoveredData.dateString})
              </span>
              <span className="text-[10px] font-semibold text-[#7C3AED] dark:text-[#C4B5FD] font-mono">
                {hoveredData.horas > 0 ? `${formatCurrency(hoveredData.valorHora)}/h` : '0h ded.'}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]" /> Faturamento:
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(hoveredData.faturamento)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Custos:
                </span>
                <span className="font-semibold text-rose-500 font-mono">
                  {formatCurrency(hoveredData.custos)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-[#252833]">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Lucro Líquido:
                </span>
                <span
                  className={`font-bold font-mono ${
                    hoveredData.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {formatCurrency(hoveredData.lucro)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
