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
  const faturamentoBase = Math.max(totalFaturamento, 1)
  const margemLucro = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0
  const pctAds = totalFaturamento > 0 ? (gastoAds / totalFaturamento) * 100 : 0
  const pctContingencia = totalFaturamento > 0 ? (gastoContingencia / totalFaturamento) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* 1. Funil de Retenção & Custos (Estilo Conversion Funnel) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Funil de Eficiência Financeira
            </h3>
            <span className="text-xs text-slate-400 font-mono">Retenção de caixa</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Do faturamento bruto até o lucro líquido real retido
          </p>

          {/* Barras do Funil em Camadas */}
          <div className="space-y-3">
            {/* Topo: Faturamento Bruto */}
            <div className="rounded-xl p-3 bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  1. Faturamento Total
                </span>
                <span className="font-mono font-bold text-[#7C3AED] dark:text-[#C4B5FD]">
                  {formatCurrency(totalFaturamento)} (100%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1E2028] overflow-hidden">
                <div className="h-full rounded-full bg-[#7C3AED] w-full" />
              </div>
            </div>

            {/* Meio: Lucro Líquido Real */}
            <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  2. Lucro Líquido Retido
                </span>
                <span className="font-mono font-bold text-emerald-500">
                  {formatCurrency(totalLucro)} ({margemLucro.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1E2028] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, margemLucro))}%` }}
                />
              </div>
            </div>

            {/* Custos de Tráfego Pago */}
            <div className="rounded-xl p-3 bg-slate-100 dark:bg-[#161820] border border-slate-200 dark:border-[#22242D]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  3. Gastos em Anúncios (Ads)
                </span>
                <span className="font-mono font-semibold text-rose-500">
                  {formatCurrency(gastoAds)} ({pctAds.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1E2028] overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, pctAds)}%` }}
                />
              </div>
            </div>

            {/* Custos de Contingência Orgânica */}
            <div className="rounded-xl p-3 bg-slate-100 dark:bg-[#161820] border border-slate-200 dark:border-[#22242D]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  4. Reposição de Contas & Proxies
                </span>
                <span className="font-mono font-semibold text-amber-500">
                  {formatCurrency(gastoContingencia)} ({pctContingencia.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1E2028] overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, pctContingencia)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2028] flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-emerald-500">💡</span>
          <span>
            Margem líquida global da agência:{' '}
            <strong className="text-emerald-500 font-mono">{margemLucro.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* 2. Curva de Crescimento da Hora (Estilo Audience Growth da Imagem) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Retorno Real da sua Hora
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C4B5FD] font-semibold">
              Média Ponderada
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            O indicador mais honesto da eficiência do seu tempo
          </p>

          {/* Destaque do Valor da Hora */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
              {formatCurrency(mediaRealHora)}
              <span className="text-base font-medium text-slate-400 ml-1">/h</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500">
              {totalHoras > 0 ? `${totalHoras.toFixed(1)}h dedicadas` : 'Sem lançamentos'}
            </span>
          </div>

          {/* Mini Gráfico de Área Suave Estilo Audience Growth */}
          <div className="relative w-full h-32 my-2 overflow-hidden rounded-xl bg-slate-50 dark:bg-[#0E0F13] p-2">
            <svg viewBox="0 0 300 90" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#84CC16" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#84CC16" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#84CC16" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Curva Suave Sobe e Desce Suave */}
              <path
                d="M 10 75 C 60 70, 100 65, 140 50 C 180 35, 230 20, 290 12 L 290 85 L 10 85 Z"
                fill="url(#growthGradient)"
              />
              <path
                d="M 10 75 C 60 70, 100 65, 140 50 C 180 35, 230 20, 290 12"
                fill="none"
                stroke="#84CC16"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="290" cy="12" r="4.5" fill="#84CC16" className="drop-shadow-md" />
              <circle cx="290" cy="12" r="2" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* Breakdown de Horas Dedicadas */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#1E2028] grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#161820]">
            <span className="text-[10px] text-slate-400 block mb-0.5">Horas Orgânico (OFM)</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {formatHours(horasOrganico)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#161820]">
            <span className="text-[10px] text-slate-400 block mb-0.5">Horas Tráfego Pago</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {formatHours(horasPago)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
