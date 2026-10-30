import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatHours, formatPercent } from '@/lib/utils'
import type { PeriodSummary } from '@/types/analytics'

interface SummaryCardsProps {
  summary: PeriodSummary
  mode: 'organico' | 'pago'
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, mode }) => {
  const isProfitPositive = summary.totalLucro >= 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Faturamento Total */}
      <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
        <CardContent className="p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Faturamento
          </span>
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(summary.totalFaturamento)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Bruto do mês</span>
        </CardContent>
      </Card>

      {/* 2. Gastos Totais */}
      <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
        <CardContent className="p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            {mode === 'organico' ? 'Contingência' : 'Gastos em Ads'}
          </span>
          <div className="text-xl sm:text-2xl font-semibold text-rose-500 font-mono tabular-nums">
            {formatCurrency(summary.totalGastos)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {mode === 'organico' ? 'Perfis + Proxies' : 'Tráfego pago'}
          </span>
        </CardContent>
      </Card>

      {/* 3. Lucro Líquido */}
      <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
        <CardContent className="p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Lucro Líquido
          </span>
          <div
            className={`text-xl sm:text-2xl font-semibold font-mono tabular-nums ${
              isProfitPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {formatCurrency(summary.totalLucro)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Faturamento − Custos</span>
        </CardContent>
      </Card>

      {/* 4. Total de Horas */}
      <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
        <CardContent className="p-4">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Horas Trabalhadas
          </span>
          <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatHours(summary.totalHoras)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Tempo dedicado</span>
        </CardContent>
      </Card>

      {/* 5. ⭐ MÉDIA REAL DA HORA (DESTAQUE LIMPO) */}
      <Card className="col-span-2 md:col-span-1 border border-[#7C3AED]/30 bg-[#7C3AED]/5 dark:bg-[#7C3AED]/10">
        <CardContent className="p-4">
          <span className="text-[11px] font-semibold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider block mb-1.5">
            Valor Real da Hora
          </span>
          <div className="text-xl sm:text-2xl font-bold text-[#7C3AED] dark:text-[#C4B5FD] font-mono tabular-nums">
            {formatCurrency(summary.mediaRealHora)}
            <span className="text-xs font-normal text-slate-500">/h</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
            Média Ponderada Real
          </span>
        </CardContent>
      </Card>

      {/* 6. Métrica Específica */}
      {mode === 'pago' ? (
        <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              ROAS Médio
            </span>
            <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
              {(summary.mediaRoas || 0).toFixed(2)}x
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              ROI: {formatPercent(summary.roiGeralPercent || 0)}
            </span>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
          <CardContent className="p-4">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Contas Repostas
            </span>
            <div className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
              {summary.totalContasRepostas || 0}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Média {formatCurrency(summary.custoMedioContaGeral || 0)}/conta
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
