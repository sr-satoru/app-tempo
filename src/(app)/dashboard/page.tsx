import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCalendarContext } from '@/contexts/calendar-context'
import { MONTH_NAMES } from '@/domain/calendar'
import {
  summarizeOrganicPeriod,
  summarizePaidPeriod,
} from '@/domain/calculations'
import { formatCurrency, formatHours } from '@/lib/utils'
import { api } from '@/services/index.api'
import type { ModeloEntity } from '@/types/model'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { selectedYear, selectedMonth } = useCalendarContext()
  const [models, setModels] = useState<ModeloEntity[]>([])
  const [organicEntries, setOrganicEntries] = useState<OrganicDailyEntry[]>([])
  const [paidEntries, setPaidEntries] = useState<PaidDailyEntry[]>([])

  useEffect(() => {
    async function loadData() {
      const [m, o, p] = await Promise.all([
        api.models.listModels(),
        api.analytics.listOrganicEntries({ year: selectedYear, month: selectedMonth }),
        api.analytics.listPaidEntries({ year: selectedYear, month: selectedMonth }),
      ])
      setModels(m)
      setOrganicEntries(o)
      setPaidEntries(p)
    }
    loadData()
  }, [selectedYear, selectedMonth])

  const organicSummary = useMemo(() => summarizeOrganicPeriod(organicEntries), [organicEntries])
  const paidSummary = useMemo(() => summarizePaidPeriod(paidEntries), [paidEntries])

  const totalFaturamento = organicSummary.totalFaturamento + paidSummary.totalFaturamento
  const totalGastos = organicSummary.totalGastos + paidSummary.totalGastos
  const totalLucro = totalFaturamento - totalGastos
  const totalHoras = organicSummary.totalHoras + paidSummary.totalHoras
  const mediaRealHoraGeral = totalHoras > 0 ? totalLucro / totalHoras : 0

  const modelRanking = useMemo(() => {
    return models
      .map((model) => {
        const mEntries = organicEntries.filter((e) => e.modeloId === model.id)
        const summary = summarizeOrganicPeriod(mEntries)
        return {
          model,
          faturamento: summary.totalFaturamento,
          contingencia: summary.totalGastos,
          lucro: summary.totalLucro,
          horas: summary.totalHoras,
          valorHora: summary.mediaRealHora,
          contasRepostas: summary.totalContasRepostas || 0,
        }
      })
      .sort((a, b) => b.valorHora - a.valorHora)
  }, [models, organicEntries])

  return (
    <div className="space-y-5">
      {/* Resumo Consolidado Minimalista */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Consolidado Geral da Agência
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[selectedMonth]} de {selectedYear}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {models.length} modelos cadastradas · Operação Orgânica & Tráfego Pago
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Lucro Líquido Geral</span>
              <span className={`text-2xl font-bold font-mono tabular-nums ${totalLucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(totalLucro)}
              </span>
            </div>

            <div className="border-l border-slate-200 dark:border-[#1E2025] pl-8">
              <span className="text-[11px] text-[#7C3AED] dark:text-[#A78BFA] font-semibold block mb-1">
                Média Geral da sua Hora
              </span>
              <span className="text-2xl font-bold font-mono tabular-nums text-[#7C3AED] dark:text-[#C4B5FD]">
                {formatCurrency(mediaRealHoraGeral)}
                <span className="text-xs font-normal text-slate-400">/h</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparativo de Operações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Painel Orgânico */}
        <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Tráfego Orgânico (OFM)</CardTitle>
              <p className="text-[11px] text-slate-400">Contingência e produção de modelos</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/organico')}
              className="text-xs h-7 border-slate-200 dark:border-[#1E2025]"
            >
              Abrir Operação
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#18191E]">
                <span className="text-[10px] text-slate-400 block mb-1">Faturamento</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatCurrency(organicSummary.totalFaturamento)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#18191E]">
                <span className="text-[10px] text-slate-400 block mb-1">Contingência</span>
                <span className="text-sm font-semibold text-rose-500 font-mono tabular-nums">
                  {formatCurrency(organicSummary.totalGastos)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#18191E]">
                <span className="text-[10px] text-slate-400 block mb-1">Sua Hora</span>
                <span className="text-sm font-semibold text-[#7C3AED] dark:text-[#A78BFA] font-mono tabular-nums">
                  {formatCurrency(organicSummary.mediaRealHora)}/h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Painel Pago */}
        <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Tráfego Pago (Ads & BMs)</CardTitle>
              <p className="text-[11px] text-slate-400">Campanhas e retorno sobre anúncios</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/pago')}
              className="text-xs h-7 border-slate-200 dark:border-[#1E2025]"
            >
              Abrir Operação
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#18191E]">
                <span className="text-[10px] text-slate-400 block mb-1">Faturamento</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {formatCurrency(paidSummary.totalFaturamento)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#18191E]">
                <span className="text-[10px] text-slate-400 block mb-1">Gastos Ads</span>
                <span className="text-sm font-semibold text-rose-500 font-mono tabular-nums">
                  {formatCurrency(paidSummary.totalGastos)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#18191E]">
                <span className="text-[10px] text-slate-400 block mb-1">ROAS Médio</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                  {(paidSummary.mediaRoas || 0).toFixed(2)}x
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Ranking das Modelos OFM com Colunas Mais Espaçosas */}
      <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">
              Ranking de Retorno das Modelos OFM ({MONTH_NAMES[selectedMonth]})
            </CardTitle>
            <p className="text-xs text-slate-400">
              Ordenadas pelo <strong>Retorno da sua Hora (R$/h)</strong>
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/organico')}
            className="text-xs h-8"
          >
            Lançar Dados
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2025] text-slate-400 font-medium">
                  <th className="py-3 px-4 w-16 text-center">Posição</th>
                  <th className="py-3 px-4">Modelo OFM</th>
                  <th className="py-3 px-4 text-right">Faturamento</th>
                  <th className="py-3 px-4 text-right">Contingência</th>
                  <th className="py-3 px-4 text-center">Contas Rep.</th>
                  <th className="py-3 px-4 text-right">Lucro Líquido</th>
                  <th className="py-3 px-4 text-right">Horas</th>
                  <th className="py-3 px-5 text-right font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                    Sua Hora (R$/h)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A1C22]">
                {modelRanking.map((item, index) => (
                  <tr
                    key={item.model.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#18191E] transition-colors cursor-pointer"
                    onClick={() => navigate('/organico')}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {index + 1}º
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {item.model.nome}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {formatCurrency(item.faturamento)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-rose-500">
                      {formatCurrency(item.contingencia)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {item.contasRepostas}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-mono font-medium tabular-nums ${item.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatCurrency(item.lucro)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {formatHours(item.horas)}
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono font-semibold tabular-nums text-[#7C3AED] dark:text-[#C4B5FD]">
                      {item.horas > 0 ? `${formatCurrency(item.valorHora)}/h` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
