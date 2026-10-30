import React from 'react'
import { formatCurrency, formatHours } from '@/lib/utils'

interface DashboardEfficiencyFunnelProps {
  totalFaturamento: number
  totalGastos: number
  totalLucro: number
  totalHoras: number
  mediaRealHora: number
  gastoAds: number
  gastoContingencia: number
  horasOrganico: number
  horasPago: number
}

interface FunnelBar {
  label: string
  sublabel?: string
  value: number
  pct: number
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

export const DashboardEfficiencyFunnel: React.FC<DashboardEfficiencyFunnelProps> = ({
  totalFaturamento,
  totalGastos,
  totalLucro,
  totalHoras,
  mediaRealHora,
  gastoAds,
  gastoContingencia,
  horasOrganico,
  horasPago,
}) => {
  const base = Math.max(totalFaturamento, 1)
  const margemLucro = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0
  const pctAds = (gastoAds / base) * 100
  const pctConting = (gastoContingencia / base) * 100

  const funnelBars: FunnelBar[] = [
    {
      label: 'Faturamento Bruto',
      sublabel: '100% — base de cálculo',
      value: totalFaturamento,
      pct: 100,
      color: '#6366F1',
      bgColor: 'rgba(99,102,241,0.08)',
      borderColor: 'rgba(99,102,241,0.25)',
      textColor: '#6366F1',
    },
    {
      label: 'Lucro Líquido Retido',
      sublabel: `${margemLucro.toFixed(1)}% de margem`,
      value: totalLucro,
      pct: Math.max(0, Math.min(100, margemLucro)),
      color: '#10B981',
      bgColor: 'rgba(16,185,129,0.07)',
      borderColor: 'rgba(16,185,129,0.2)',
      textColor: '#10B981',
    },
    {
      label: 'Gastos em Anúncios',
      sublabel: `${pctAds.toFixed(1)}% do faturamento`,
      value: gastoAds,
      pct: Math.min(100, pctAds),
      color: '#F43F5E',
      bgColor: 'rgba(244,63,94,0.06)',
      borderColor: 'rgba(244,63,94,0.18)',
      textColor: '#F43F5E',
    },
    {
      label: 'Reposição de Contas',
      sublabel: `${pctConting.toFixed(1)}% do faturamento`,
      value: gastoContingencia,
      pct: Math.min(100, pctConting),
      color: '#F59E0B',
      bgColor: 'rgba(245,158,11,0.07)',
      borderColor: 'rgba(245,158,11,0.2)',
      textColor: '#F59E0B',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Left: Conversion funnel — exactly like the reference image */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12] p-5 shadow-sm flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Funil de Eficiência
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Retenção de caixa</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Do faturamento bruto até o lucro líquido real
          </p>
        </div>

        {/* Funnel bars — widths cascade like the reference */}
        <div className="flex-1 space-y-2.5">
          {funnelBars.map((bar, i) => {
            // Cascade width: each bar narrows slightly like an actual funnel
            const cascadeWidth = [100, Math.max(20, bar.pct), Math.min(70, Math.max(10, bar.pct + 5)), Math.min(50, Math.max(8, bar.pct + 3))][i] ?? bar.pct
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{bar.label}</span>
                  <span className="font-mono font-semibold" style={{ color: bar.textColor }}>
                    {formatCurrency(bar.value)}
                  </span>
                </div>
                <div className="h-7 w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-[#16171D] relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700 flex items-center px-2.5"
                    style={{
                      width: `${cascadeWidth}%`,
                      backgroundColor: bar.color,
                      opacity: 0.85,
                    }}
                  >
                    <span className="text-white text-[10px] font-semibold font-mono truncate">
                      {bar.sublabel}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2025] flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="text-emerald-500">✦</span>
          <span>
            Margem líquida global:{' '}
            <strong className="text-emerald-500 font-mono">{margemLucro.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* Right: Hour rate growth panel — like "Audience Growth" in the reference */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12] p-5 shadow-sm flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Retorno Real da Hora
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 font-semibold">
              Média Ponderada
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Indicador mais honesto da eficiência do seu tempo
          </p>
        </div>

        {/* Big number — like "186.4K" in the reference */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
            {formatCurrency(mediaRealHora)}
          </span>
          <span className="text-sm text-slate-400 font-medium">/hora</span>
          {totalHoras > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ml-1">
              +{totalHoras.toFixed(1)}h dedicadas
            </span>
          )}
        </div>

        {/* Mini sparkline like the reference image */}
        <div className="relative w-full h-28 my-3 overflow-hidden rounded-xl bg-slate-50 dark:bg-[#0E0F13]">
          <svg viewBox="0 0 300 90" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hourGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84CC16" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 0 80 C 50 78, 80 72, 120 58 C 160 44, 200 28, 250 16 C 265 13, 280 11, 300 8 L 300 90 L 0 90 Z"
              fill="url(#hourGrowthGrad)"
            />
            <path
              d="M 0 80 C 50 78, 80 72, 120 58 C 160 44, 200 28, 250 16 C 265 13, 280 11, 300 8"
              fill="none"
              stroke="#84CC16"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="300" cy="8" r="4.5" fill="#84CC16" />
            <circle cx="300" cy="8" r="2" fill="#fff" />
          </svg>
        </div>

        {/* Hours breakdown — like the stats under the audience chart in the reference */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-[#1E2025] grid grid-cols-3 gap-3 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px] mb-0.5">Total horas</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatHours(totalHoras)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] mb-0.5">OFM Orgânico</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatHours(horasOrganico)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] mb-0.5">Tráfego Pago</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatHours(horasPago)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
