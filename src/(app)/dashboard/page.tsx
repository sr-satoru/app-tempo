import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCalendarContext } from '@/contexts/calendar-context'
import { MONTH_NAMES, getDaysInMonth } from '@/domain/calendar'
import {
  summarizeOrganicPeriod,
  summarizePaidPeriod,
  calculateOrganicDaily,
  calculatePaidDaily,
} from '@/domain/calculations'
import { formatCurrency, formatHours } from '@/lib/utils'
import { api } from '@/services/index.api'
import type { ModeloEntity } from '@/types/model'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'
import {
  DashboardPerformanceChart,
  type DailyDataPoint,
} from '@/components/analytics/dashboard-performance-chart'
import {
  DashboardChannelDonut,
  type ChannelShareItem,
} from '@/components/analytics/dashboard-channel-donut'
import { DashboardEfficiencyFunnel } from '@/components/analytics/dashboard-efficiency-funnel'

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

  // Resumos dos períodos
  const organicSummary = useMemo(() => summarizeOrganicPeriod(organicEntries), [organicEntries])
  const paidSummary = useMemo(() => summarizePaidPeriod(paidEntries), [paidEntries])

  const totalFaturamento = organicSummary.totalFaturamento + paidSummary.totalFaturamento
  const totalGastos = organicSummary.totalGastos + paidSummary.totalGastos
  const totalLucro = totalFaturamento - totalGastos
  const totalHoras = organicSummary.totalHoras + paidSummary.totalHoras
  const mediaRealHoraGeral = totalHoras > 0 ? totalLucro / totalHoras : 0
  const margemGeral = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0

  // Dias do mês atual para o gráfico de performance diária
  const monthDays = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  // Agregação dos dados diários para o gráfico principal
  const dailyPerformanceData = useMemo<DailyDataPoint[]>(() => {
    return monthDays.map((day) => {
      const oEntries = organicEntries.filter((e) => e.data === day.dateString)
      const pEntries = paidEntries.filter((e) => e.data === day.dateString)

      let fat = 0
      let cust = 0
      let horas = 0

      oEntries.forEach((e) => {
        const c = calculateOrganicDaily(e)
        fat += e.faturamento
        cust += c.totalContingencia
        horas += e.horasTrabalhadas
      })

      pEntries.forEach((e) => {
        const c = calculatePaidDaily(e)
        fat += e.faturamento
        cust += c.totalGastos
        horas += e.horasTrabalhadas
      })

      const lucro = fat - cust
      const valorHora = horas > 0 ? lucro / horas : 0

      return {
        dayNumber: day.dayNumber,
        dateString: day.dateString,
        faturamento: fat,
        custos: cust,
        lucro,
        horas,
        valorHora,
      }
    })
  }, [monthDays, organicEntries, paidEntries])

  // Distribuição de faturamento por canais (Donut chart)
  const channelShares = useMemo<ChannelShareItem[]>(() => {
    const channelMap = new Map<string, number>()

    // Orgânico por canal
    organicEntries.forEach((e) => {
      const ch = e.canalRedeSocial || 'Outros'
      channelMap.set(ch, (channelMap.get(ch) || 0) + e.faturamento)
    })

    // Tráfego pago consolidado
    const totalPago = paidSummary.totalFaturamento
    if (totalPago > 0) {
      channelMap.set('Tráfego Pago (Ads)', totalPago)
    }

    const colorPalette: Record<string, string> = {
      TikTok: '#7C3AED',
      Instagram: '#3B82F6',
      Reddit: '#EC4899',
      YouTube: '#EF4444',
      Twitter: '#06B6D4',
      Outros: '#F59E0B',
      'Tráfego Pago (Ads)': '#10B981',
    }

    const items: ChannelShareItem[] = []
    channelMap.forEach((fat, channel) => {
      items.push({
        channel,
        faturamento: fat,
        color: colorPalette[channel] || '#8B5CF6',
      })
    })

    return items.sort((a, b) => b.faturamento - a.faturamento)
  }, [organicEntries, paidSummary.totalFaturamento])

  // Ranking das modelos ordenadas pelo retorno da hora (R$/h)
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

  // Saudação de acordo com o horário do dia
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const topModel = modelRanking.length > 0 && modelRanking[0].valorHora > 0 ? modelRanking[0] : null

  return (
    <div className="space-y-6">
      {/* 1. Header do Dashboard (Estilo Minimalista da Imagem) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}, Operador.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sua operação está com{' '}
            <strong className="text-emerald-500 font-semibold font-mono">
              {margemGeral.toFixed(1)}% de margem líquida
            </strong>{' '}
            em {MONTH_NAMES[selectedMonth]} de {selectedYear}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge Live Data */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dados em Tempo Real</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/organico')}
            className="text-xs h-8 border-slate-200 dark:border-[#1E2025]"
          >
            Tráfego Orgânico
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/pago')}
            className="text-xs h-8"
          >
            Tráfego Pago
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Cards de Métricas Principais (Estilo Fintech da Imagem) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Total */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Faturamento Bruto
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C4B5FD]">
              Total
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(totalFaturamento)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {formatCurrency(organicSummary.totalFaturamento)} orgânico ·{' '}
            {formatCurrency(paidSummary.totalFaturamento)} ads
          </p>
        </div>

        {/* Card 2: Custos & Contingência */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Custos de Operação
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 text-rose-500">
              Contingência
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 font-mono tabular-nums">
            {formatCurrency(totalGastos)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {organicSummary.totalContasRepostas || 0} contas repostas ·{' '}
            {formatCurrency(paidSummary.totalGastos)} em Ads
          </p>
        </div>

        {/* Card 3: Lucro Líquido Real */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Lucro Líquido Real
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-500 font-mono">
              +{margemGeral.toFixed(0)}%
            </span>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
              totalLucro >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {formatCurrency(totalLucro)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Receita líquida real após dedução de todas contingências
          </p>
        </div>

        {/* Card 4: Sua Hora Média Ponderada (⭐ KPI Principal) */}
        <div className="rounded-2xl border border-purple-200/70 dark:border-[#7C3AED]/30 bg-purple-50/30 dark:bg-[#7C3AED]/10 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7C3AED] dark:text-[#C4B5FD]">
              Sua Hora Real Média
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#7C3AED] text-white">
              KPI Chave
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#7C3AED] dark:text-[#C4B5FD] font-mono tabular-nums">
            {formatCurrency(mediaRealHoraGeral)}
            <span className="text-sm font-normal text-slate-400 ml-1">/h</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Média Ponderada Real: {formatHours(totalHoras)} dedicadas no mês
          </p>
        </div>
      </div>

      {/* 3. Seção Visual Central: Gráfico de Ondas + Donut de Atribuição (Estilo Imagem de Referência) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico de Ondas 2/3 */}
        <div className="lg:col-span-2">
          <DashboardPerformanceChart data={dailyPerformanceData} />
        </div>

        {/* Donut de Atribuição por Canal 1/3 */}
        <div className="lg:col-span-1">
          <DashboardChannelDonut items={channelShares} totalFaturamento={totalFaturamento} />
        </div>
      </div>

      {/* 4. Funil de Eficiência & Curva de Crescimento da Hora */}
      <DashboardEfficiencyFunnel
        totalFaturamento={totalFaturamento}
        totalGastos={totalGastos}
        totalLucro={totalLucro}
        totalHoras={totalHoras}
        mediaRealHora={mediaRealHoraGeral}
        gastoAds={paidSummary.totalGastos}
        gastoContingencia={organicSummary.totalGastos}
        horasOrganico={organicSummary.totalHoras}
        horasPago={paidSummary.totalHoras}
      />

      {/* 5. Seção Inferior: Top Modelos/Campanhas + Diagnóstico Inteligente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ranking das Melhores Modelos OFM (2/3) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ranking de Retorno das Modelos OFM
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Classificadas pelo retorno da sua hora trabalhada (R$/h)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/organico')}
              className="text-xs h-7 border-slate-200 dark:border-[#1E2025]"
            >
              Ver Tabela Completa
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2025] bg-slate-50/80 dark:bg-[#16171D] text-slate-500 dark:text-slate-400 font-medium text-[11px] select-none">
                  <th className="py-2 px-3 w-16 text-center">Posição</th>
                  <th className="py-2 px-3">Modelo OFM</th>
                  <th className="py-2 px-3 text-right">Faturamento</th>
                  <th className="py-2 px-3 text-right">Contingência</th>
                  <th className="py-2 px-3 text-center">Contas Rep.</th>
                  <th className="py-2 px-3 text-right">Lucro Líquido</th>
                  <th className="py-2 px-3 text-right">Horas</th>
                  <th className="py-2 px-3 text-right font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                    Sua Hora (R$/h)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E2025]">
                {modelRanking.slice(0, 6).map((item, index) => {
                  const isEven = index % 2 === 0
                  return (
                    <tr
                      key={item.model.id}
                      className={`h-8 transition-colors cursor-pointer hover:bg-purple-50/70 dark:hover:bg-[#252834] ${
                        isEven ? 'bg-white dark:bg-[#0E0F12]' : 'bg-[#F1F5F9] dark:bg-[#1A1C24]'
                      }`}
                      onClick={() => navigate('/organico')}
                    >
                      <td className="py-1 px-3 text-center font-mono font-bold text-xs text-slate-400">
                        {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                      </td>

                      <td className="py-1 px-3 font-semibold text-slate-900 dark:text-white text-xs">
                        {item.model.nome}
                      </td>

                      <td className="py-1 px-3 text-right font-mono tabular-nums text-xs">
                        {formatCurrency(item.faturamento)}
                      </td>

                      <td className="py-1 px-3 text-right font-mono tabular-nums text-rose-500 text-xs">
                        {formatCurrency(item.contingencia)}
                      </td>

                      <td className="py-1 px-3 text-center font-mono text-slate-400 text-xs">
                        {item.contasRepostas}
                      </td>

                      <td
                        className={`py-1 px-3 text-right font-mono font-semibold tabular-nums text-xs ${
                          item.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formatCurrency(item.lucro)}
                      </td>

                      <td className="py-1 px-3 text-right font-mono text-slate-400 text-xs">
                        {formatHours(item.horas)}
                      </td>

                      <td className="py-1 px-3 text-right font-mono font-bold text-xs tabular-nums text-[#7C3AED] dark:text-[#C4B5FD]">
                        {item.horas > 0 ? `${formatCurrency(item.valorHora)}/h` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diagnóstico & Atividades da Operação (1/3 - Estilo Recent Activity) */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Diagnóstico da Agência
              </h3>
              <span className="text-[11px] font-mono text-emerald-500">● Operação OK</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Insights calculados automaticamente sobre seu negócio
            </p>

            <div className="space-y-3">
              {/* Insight 1: Top Modelo */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                <span className="text-base">🚀</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Modelo com Maior Eficiência
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {topModel ? (
                      <>
                        <strong>{topModel.model.nome}</strong> está gerando{' '}
                        <strong className="text-[#7C3AED] dark:text-[#C4B5FD]">
                          {formatCurrency(topModel.valorHora)}/h
                        </strong>
                        .
                      </>
                    ) : (
                      'Nenhum dado com horas registrado no mês.'
                    )}
                  </p>
                </div>
              </div>

              {/* Insight 2: Média Ponderada Real */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#161820] border border-slate-200 dark:border-[#22242D] flex items-start gap-3">
                <span className="text-base">⏱️</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Retorno Geral do Tempo
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sua média ponderada real é de{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {formatCurrency(mediaRealHoraGeral)}/h
                    </strong>{' '}
                    em {formatHours(totalHoras)} totais.
                  </p>
                </div>
              </div>

              {/* Insight 3: Contingência */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#161820] border border-slate-200 dark:border-[#22242D] flex items-start gap-3">
                <span className="text-base">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Saúde de Contingência
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {(organicSummary.totalContasRepostas ?? 0) > 0 ? (
                      <>
                        Custo médio de{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {formatCurrency(
                            organicSummary.totalGastos / (organicSummary.totalContasRepostas || 1)
                          )}
                        </strong>{' '}
                        por conta reposta.
                      </>
                    ) : (
                      'Nenhuma reposição de conta registrada neste período.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé de Status */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1E2028] flex items-center justify-between text-xs text-slate-400">
            <span>Sistema 100% offline & local</span>
            <span className="font-mono text-emerald-500">v1.0 Ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}
