import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCalendarContext } from '@/contexts/calendar-context'
import { MONTH_NAMES, getDaysInMonth } from '@/domain/calendar'
import {
  summarizeOrganicPeriod,
  summarizePaidPeriod,
  calculateOrganicDaily,
  calculatePaidDaily,
} from '@/domain/calculations'
import { formatCurrency, formatHours, formatPercent } from '@/lib/utils'
import { api } from '@/services/index.api'
import type { ModeloEntity, PaidProfileEntity } from '@/types/model'
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

type OperationFilter = 'all' | 'organic' | 'paid'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { selectedYear, selectedMonth } = useCalendarContext()

  // Dados brutos
  const [models, setModels] = useState<ModeloEntity[]>([])
  const [paidProfiles, setPaidProfiles] = useState<PaidProfileEntity[]>([])
  const [organicEntries, setOrganicEntries] = useState<OrganicDailyEntry[]>([])
  const [paidEntries, setPaidEntries] = useState<PaidDailyEntry[]>([])

  // Estados de Filtros Completos
  const [selectedOperation, setSelectedOperation] = useState<OperationFilter>('all')
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all')
  const [activeRankingTab, setActiveRankingTab] = useState<'models' | 'profiles'>('models')

  useEffect(() => {
    async function loadData() {
      const [m, pProfiles, o, p] = await Promise.all([
        api.models.listModels(),
        api.models.listPaidProfiles(),
        api.analytics.listOrganicEntries({ year: selectedYear, month: selectedMonth }),
        api.analytics.listPaidEntries({ year: selectedYear, month: selectedMonth }),
      ])
      setModels(m)
      setPaidProfiles(pProfiles)
      setOrganicEntries(o)
      setPaidEntries(p)
    }
    loadData()
  }, [selectedYear, selectedMonth])

  // Ajusta a aba do ranking conforme a operação selecionada
  useEffect(() => {
    if (selectedOperation === 'paid') {
      setActiveRankingTab('profiles')
    } else if (selectedOperation === 'organic') {
      setActiveRankingTab('models')
    }
  }, [selectedOperation])

  // Entradas Filtradas dinamicamente
  const filteredOrganicEntries = useMemo(() => {
    if (selectedOperation === 'paid') return []
    if (selectedEntityId === 'all') return organicEntries

    // Se uma modelo específica estiver selecionada
    const isModel = models.some((m) => m.id === selectedEntityId)
    if (isModel) {
      return organicEntries.filter((e) => e.modeloId === selectedEntityId)
    }

    // Se selecionou uma BM enquanto em 'all', organicEntries fica vazio
    return []
  }, [selectedOperation, selectedEntityId, organicEntries, models])

  const filteredPaidEntries = useMemo(() => {
    if (selectedOperation === 'organic') return []
    if (selectedEntityId === 'all') return paidEntries

    // Se um perfil/BM específico estiver selecionado
    const isProfile = paidProfiles.some((p) => p.id === selectedEntityId)
    if (isProfile) {
      return paidEntries.filter((e) => e.profileId === selectedEntityId)
    }

    // Se selecionou uma Modelo enquanto em 'all', paidEntries fica vazio
    return []
  }, [selectedOperation, selectedEntityId, paidEntries, paidProfiles])

  // Resumos dos períodos calculados dinamicamente com base no filtro
  const organicSummary = useMemo(
    () => summarizeOrganicPeriod(filteredOrganicEntries),
    [filteredOrganicEntries]
  )
  const paidSummary = useMemo(
    () => summarizePaidPeriod(filteredPaidEntries),
    [filteredPaidEntries]
  )

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
      const oEntries = filteredOrganicEntries.filter((e) => e.data === day.dateString)
      const pEntries = filteredPaidEntries.filter((e) => e.data === day.dateString)

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
  }, [monthDays, filteredOrganicEntries, filteredPaidEntries])

  // Distribuição de faturamento para o Donut Chart
  const channelShares = useMemo<ChannelShareItem[]>(() => {
    const channelMap = new Map<string, number>()

    if (selectedOperation === 'paid') {
      // Quando filtrado em Pago: mostra divisão por BM
      paidProfiles.forEach((p) => {
        const entries = filteredPaidEntries.filter((e) => e.profileId === p.id)
        const total = entries.reduce((acc, curr) => acc + curr.faturamento, 0)
        if (total > 0) {
          channelMap.set(p.nome, total)
        }
      })
    } else {
      // Orgânico por canal
      filteredOrganicEntries.forEach((e) => {
        const ch = e.canalRedeSocial || 'Outros'
        channelMap.set(ch, (channelMap.get(ch) || 0) + e.faturamento)
      })

      // Se todas as operações, adiciona o tráfego pago
      if (selectedOperation === 'all') {
        const totalPago = paidSummary.totalFaturamento
        if (totalPago > 0) {
          channelMap.set('Tráfego Pago (Ads)', totalPago)
        }
      }
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

    const fallbackColors = ['#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4']
    let colorIdx = 0

    const items: ChannelShareItem[] = []
    channelMap.forEach((fat, channel) => {
      items.push({
        channel,
        faturamento: fat,
        color: colorPalette[channel] || fallbackColors[colorIdx++ % fallbackColors.length],
      })
    })

    return items.sort((a, b) => b.faturamento - a.faturamento)
  }, [filteredOrganicEntries, filteredPaidEntries, selectedOperation, paidProfiles, paidSummary.totalFaturamento])

  // Ranking das Modelos OFM
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

  // Ranking das BMs de Tráfego Pago
  const profileRanking = useMemo(() => {
    return paidProfiles
      .map((profile) => {
        const pEntries = paidEntries.filter((e) => e.profileId === profile.id)
        const summary = summarizePaidPeriod(pEntries)
        return {
          profile,
          faturamento: summary.totalFaturamento,
          gastoAds: summary.totalGastos,
          lucro: summary.totalLucro,
          horas: summary.totalHoras,
          valorHora: summary.mediaRealHora,
          roas: summary.mediaRoas || 0,
          roiPercent: summary.roiGeralPercent || 0,
        }
      })
      .sort((a, b) => b.valorHora - a.valorHora)
  }, [paidProfiles, paidEntries])

  // Saudação de acordo com o horário do dia
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  // Identificação do filtro ativo para exibição no cabeçalho
  const activeFilterName = useMemo(() => {
    if (selectedEntityId !== 'all') {
      const mod = models.find((m) => m.id === selectedEntityId)
      if (mod) return `Modelo: ${mod.nome}`
      const prof = paidProfiles.find((p) => p.id === selectedEntityId)
      if (prof) return `BM: ${prof.nome}`
    }
    if (selectedOperation === 'organic') return 'Tráfego Orgânico (OFM)'
    if (selectedOperation === 'paid') return 'Tráfego Pago (Ads & BMs)'
    return 'Todas as Operações (Consolidado)'
  }, [selectedOperation, selectedEntityId, models, paidProfiles])

  return (
    <div className="space-y-6">
      {/* 1. Header do Dashboard com Indicadores e Navegação Direta */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}, Operador.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualizando{' '}
            <strong className="text-[#7C3AED] dark:text-[#A78BFA] font-semibold">
              {activeFilterName}
            </strong>{' '}
            em {MONTH_NAMES[selectedMonth]} de {selectedYear} (
            <span className="font-mono text-emerald-500 font-semibold">{margemGeral.toFixed(1)}% margem</span>).
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            Lançamentos Orgânico
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/pago')}
            className="text-xs h-8"
          >
            Lançamentos Pago
          </Button>
        </div>
      </div>

      {/* 2. Barra de Filtros Completa: Operação e Conta / Modelo / BM */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Seletor de Tipo de Operação */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 select-none">
              Operação:
            </span>

            <button
              type="button"
              onClick={() => {
                setSelectedOperation('all')
                setSelectedEntityId('all')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedOperation === 'all'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#181920] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#22242D]'
              }`}
            >
              📊 Todas as Operações
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOperation('organic')
                setSelectedEntityId('all')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedOperation === 'organic'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#181920] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#22242D]'
              }`}
            >
              🌸 Tráfego Orgânico (OFM)
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOperation('paid')
                setSelectedEntityId('all')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedOperation === 'paid'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#181920] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#22242D]'
              }`}
            >
              ⚡ Tráfego Pago (Ads & BMs)
            </button>
          </div>

          {/* Seletor Específico de Conta / Modelo / BM */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
              Filtrar por:
            </span>

            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="h-8.5 px-3 rounded-lg border border-slate-200 dark:border-[#22242D] bg-slate-50 dark:bg-[#181920] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="all">
                {selectedOperation === 'organic'
                  ? 'Todas as Modelos OFM'
                  : selectedOperation === 'paid'
                  ? 'Todas as BMs / Perfis'
                  : 'Todos os Perfis & Modelos'}
              </option>

              {/* Opções de Modelos Orgânicas */}
              {(selectedOperation === 'all' || selectedOperation === 'organic') && (
                <optgroup label="Modelos OFM (Orgânico)">
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Opções de Perfis / BMs Pagos */}
              {(selectedOperation === 'all' || selectedOperation === 'paid') && (
                <optgroup label="BMs / Perfis (Tráfego Pago)">
                  {paidProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Botão de Reset quando filtro está ativo */}
            {(selectedOperation !== 'all' || selectedEntityId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedOperation('all')
                  setSelectedEntityId('all')
                }}
                className="h-8.5 px-2.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Limpar filtros e voltar para visão geral"
              >
                ✕ Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Top 4 Cards de Métricas Principais (Calculados dinamicamente com base no filtro) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Faturamento Bruto
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C4B5FD]">
              {selectedOperation === 'all' ? 'Consolidado' : selectedOperation === 'organic' ? 'Orgânico' : 'Tráfego Pago'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(totalFaturamento)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {selectedOperation === 'all' ? (
              <>
                {formatCurrency(organicSummary.totalFaturamento)} orgânico ·{' '}
                {formatCurrency(paidSummary.totalFaturamento)} ads
              </>
            ) : selectedOperation === 'organic' ? (
              'Receita gerada pelas redes sociais das modelos'
            ) : (
              'Receita bruta das campanhas de tráfego pago'
            )}
          </p>
        </div>

        {/* Card 2: Custos & Contingência */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Custos Operacionais
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/15 text-rose-500">
              {selectedOperation === 'paid' ? 'Gasto em Ads' : 'Contingência'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 font-mono tabular-nums">
            {formatCurrency(totalGastos)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {selectedOperation === 'paid' ? (
              <>ROAS Médio: {(paidSummary.mediaRoas || 0).toFixed(2)}x · ROI: {formatPercent(paidSummary.roiGeralPercent || 0)}</>
            ) : (
              <>{organicSummary.totalContasRepostas || 0} contas repostas · {formatCurrency(paidSummary.totalGastos)} em Ads</>
            )}
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
            Receita líquida após dedução total de custos e contingência
          </p>
        </div>

        {/* Card 4: Sua Hora Média Ponderada (⭐ KPI Principal) */}
        <div className="rounded-2xl border border-purple-200/70 dark:border-[#7C3AED]/30 bg-purple-50/30 dark:bg-[#7C3AED]/10 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7C3AED] dark:text-[#C4B5FD]">
              Sua Hora Real Média
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#7C3AED] text-white">
              Ponderada
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#7C3AED] dark:text-[#C4B5FD] font-mono tabular-nums">
            {formatCurrency(mediaRealHoraGeral)}
            <span className="text-sm font-normal text-slate-400 ml-1">/h</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {formatHours(totalHoras)} dedicadas no período filtrado
          </p>
        </div>
      </div>

      {/* 4. Gráficos Visuais Centrais (Desempenho Diário + Atribuição Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardPerformanceChart data={dailyPerformanceData} />
        </div>

        <div className="lg:col-span-1">
          <DashboardChannelDonut items={channelShares} totalFaturamento={totalFaturamento} />
        </div>
      </div>

      {/* 5. Funil de Retenção de Eficiência Financeira e Curva da Hora */}
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

      {/* 6. Tabela Completa de Ranking em Largura Total (Sem a caixa de diagnóstico inútil) */}
      <div className="w-full rounded-2xl border border-slate-200/90 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {activeRankingTab === 'models'
                ? 'Ranking de Retorno das Modelos OFM'
                : 'Ranking de Retorno das BMs (Tráfego Pago)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ordenadas pelo <strong>Retorno Real da sua Hora (R$/h)</strong> e eficiência
            </p>
          </div>

          {/* Abas para alternar ranking de modelos ou BMs quando em visão consolidada */}
          <div className="flex items-center gap-2">
            {selectedOperation === 'all' && (
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#181920] border border-slate-200 dark:border-[#22242D]">
                <button
                  type="button"
                  onClick={() => setActiveRankingTab('models')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeRankingTab === 'models'
                      ? 'bg-white dark:bg-[#121316] text-[#7C3AED] dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Modelos OFM ({models.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRankingTab('profiles')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeRankingTab === 'profiles'
                      ? 'bg-white dark:bg-[#121316] text-[#7C3AED] dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  BMs / Perfis ({paidProfiles.length})
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(activeRankingTab === 'models' ? '/organico' : '/pago')}
              className="text-xs h-8 border-slate-200 dark:border-[#1E2025]"
            >
              Abrir Operação Completa
            </Button>
          </div>
        </div>

        {/* Tabela do Ranking de Modelos OFM */}
        {activeRankingTab === 'models' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2025] bg-slate-50/80 dark:bg-[#16171D] text-slate-500 dark:text-slate-400 font-medium text-[11px] select-none">
                  <th className="py-2.5 px-3 w-16 text-center">Posição</th>
                  <th className="py-2.5 px-3">Modelo OFM</th>
                  <th className="py-2.5 px-3 text-right">Faturamento</th>
                  <th className="py-2.5 px-3 text-right">Contingência</th>
                  <th className="py-2.5 px-3 text-center">Contas Rep.</th>
                  <th className="py-2.5 px-3 text-right">Lucro Líquido</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                  <th className="py-2.5 px-4 text-right font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                    Sua Hora (R$/h)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E2025]">
                {modelRanking.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                      Nenhuma modelo cadastrada no momento.
                    </td>
                  </tr>
                ) : (
                  modelRanking.map((item, index) => {
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

                        <td className="py-1 px-4 text-right font-mono font-bold text-xs tabular-nums text-[#7C3AED] dark:text-[#C4B5FD]">
                          {item.horas > 0 ? `${formatCurrency(item.valorHora)}/h` : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela do Ranking de BMs / Perfis de Tráfego Pago */}
        {activeRankingTab === 'profiles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2025] bg-slate-50/80 dark:bg-[#16171D] text-slate-500 dark:text-slate-400 font-medium text-[11px] select-none">
                  <th className="py-2.5 px-3 w-16 text-center">Posição</th>
                  <th className="py-2.5 px-3">Perfil / BM</th>
                  <th className="py-2.5 px-3 text-right">Faturamento</th>
                  <th className="py-2.5 px-3 text-right">Gasto em Ads</th>
                  <th className="py-2.5 px-3 text-right">Lucro Líquido</th>
                  <th className="py-2.5 px-3 text-right">ROAS</th>
                  <th className="py-2.5 px-3 text-right">ROI %</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                  <th className="py-2.5 px-4 text-right font-bold text-[#7C3AED] dark:text-[#A78BFA]">
                    Sua Hora (R$/h)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E2025]">
                {profileRanking.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400 text-xs">
                      Nenhum perfil ou BM cadastrado no momento.
                    </td>
                  </tr>
                ) : (
                  profileRanking.map((item, index) => {
                    const isEven = index % 2 === 0
                    return (
                      <tr
                        key={item.profile.id}
                        className={`h-8 transition-colors cursor-pointer hover:bg-purple-50/70 dark:hover:bg-[#252834] ${
                          isEven ? 'bg-white dark:bg-[#0E0F12]' : 'bg-[#F1F5F9] dark:bg-[#1A1C24]'
                        }`}
                        onClick={() => navigate('/pago')}
                      >
                        <td className="py-1 px-3 text-center font-mono font-bold text-xs text-slate-400">
                          {index === 0 ? '🥇 1º' : index === 1 ? '🥈 2º' : index === 2 ? '🥉 3º' : `${index + 1}º`}
                        </td>

                        <td className="py-1 px-3 font-semibold text-slate-900 dark:text-white text-xs">
                          {item.profile.nome}
                        </td>

                        <td className="py-1 px-3 text-right font-mono tabular-nums text-xs">
                          {formatCurrency(item.faturamento)}
                        </td>

                        <td className="py-1 px-3 text-right font-mono tabular-nums text-rose-500 text-xs">
                          {formatCurrency(item.gastoAds)}
                        </td>

                        <td
                          className={`py-1 px-3 text-right font-mono font-semibold tabular-nums text-xs ${
                            item.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {formatCurrency(item.lucro)}
                        </td>

                        <td className="py-1 px-3 text-right font-mono text-xs">
                          {item.roas > 0 ? `${item.roas.toFixed(2)}x` : '—'}
                        </td>

                        <td className="py-1 px-3 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          {item.roiPercent !== 0 ? formatPercent(item.roiPercent) : '—'}
                        </td>

                        <td className="py-1 px-3 text-right font-mono text-slate-400 text-xs">
                          {formatHours(item.horas)}
                        </td>

                        <td className="py-1 px-4 text-right font-mono font-bold text-xs tabular-nums text-[#7C3AED] dark:text-[#C4B5FD]">
                          {item.horas > 0 ? `${formatCurrency(item.valorHora)}/h` : '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
