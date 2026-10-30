import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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

// ---- KPI Card Component (exactly like reference image) ----
interface KpiCardProps {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  sub?: string
  accent?: boolean
  icon?: string
}

function KpiCard({ label, value, delta, deltaPositive = true, sub, accent, icon }: KpiCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        accent
          ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-500/5'
          : 'border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
          {label}
        </span>
        {delta !== undefined && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              deltaPositive
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
            }`}
          >
            {delta}
          </span>
        )}
        {icon && !delta && (
          <span className="text-base opacity-60">{icon}</span>
        )}
      </div>
      <div
        className={`text-[26px] font-extrabold tabular-nums font-mono tracking-tight leading-none ${
          accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </div>
      {sub && (
        <p className="text-[11px] text-slate-400 mt-2 leading-snug">{sub}</p>
      )}
    </div>
  )
}

// ---- Filter Pill ----
interface PillProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}
function Pill({ active, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-slate-100 dark:bg-[#16171D] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1E2028]'
      }`}
    >
      {children}
    </button>
  )
}

// ---- Main Dashboard ----
export default function DashboardPage() {
  const navigate = useNavigate()
  const { selectedYear, selectedMonth } = useCalendarContext()

  const [models, setModels] = useState<ModeloEntity[]>([])
  const [paidProfiles, setPaidProfiles] = useState<PaidProfileEntity[]>([])
  const [organicEntries, setOrganicEntries] = useState<OrganicDailyEntry[]>([])
  const [paidEntries, setPaidEntries] = useState<PaidDailyEntry[]>([])

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

  useEffect(() => {
    if (selectedOperation === 'paid') setActiveRankingTab('profiles')
    else if (selectedOperation === 'organic') setActiveRankingTab('models')
  }, [selectedOperation])

  const filteredOrganicEntries = useMemo(() => {
    if (selectedOperation === 'paid') return []
    if (selectedEntityId === 'all') return organicEntries
    const isModel = models.some((m) => m.id === selectedEntityId)
    if (isModel) return organicEntries.filter((e) => e.modeloId === selectedEntityId)
    return []
  }, [selectedOperation, selectedEntityId, organicEntries, models])

  const filteredPaidEntries = useMemo(() => {
    if (selectedOperation === 'organic') return []
    if (selectedEntityId === 'all') return paidEntries
    const isProfile = paidProfiles.some((p) => p.id === selectedEntityId)
    if (isProfile) return paidEntries.filter((e) => e.profileId === selectedEntityId)
    return []
  }, [selectedOperation, selectedEntityId, paidEntries, paidProfiles])

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
  const roasMedio = paidSummary.mediaRoas ?? 0

  const monthDays = useMemo(() => getDaysInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth])

  const dailyPerformanceData = useMemo<DailyDataPoint[]>(() => {
    return monthDays.map((day) => {
      const oEntries = filteredOrganicEntries.filter((e) => e.data === day.dateString)
      const pEntries = filteredPaidEntries.filter((e) => e.data === day.dateString)
      let fat = 0, cust = 0, horas = 0
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
      return {
        dayNumber: day.dayNumber,
        dateString: day.dateString,
        faturamento: fat,
        custos: cust,
        lucro,
        horas,
        valorHora: horas > 0 ? lucro / horas : 0,
      }
    })
  }, [monthDays, filteredOrganicEntries, filteredPaidEntries])

  const channelShares = useMemo<ChannelShareItem[]>(() => {
    const map = new Map<string, number>()
    if (selectedOperation === 'paid') {
      paidProfiles.forEach((p) => {
        const total = filteredPaidEntries.filter((e) => e.profileId === p.id).reduce((a, c) => a + c.faturamento, 0)
        if (total > 0) map.set(p.nome, total)
      })
    } else {
      filteredOrganicEntries.forEach((e) => {
        const ch = e.canalRedeSocial || 'Outros'
        map.set(ch, (map.get(ch) || 0) + e.faturamento)
      })
      if (selectedOperation === 'all' && paidSummary.totalFaturamento > 0) {
        map.set('Tráfego Pago (Ads)', paidSummary.totalFaturamento)
      }
    }
    const palette: Record<string, string> = {
      TikTok: '#6366F1',
      Instagram: '#3B82F6',
      Reddit: '#EC4899',
      YouTube: '#EF4444',
      Twitter: '#06B6D4',
      Outros: '#F59E0B',
      'Tráfego Pago (Ads)': '#10B981',
    }
    const fallback = ['#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4']
    let ci = 0
    const items: ChannelShareItem[] = []
    map.forEach((fat, ch) => {
      items.push({ channel: ch, faturamento: fat, color: palette[ch] || fallback[ci++ % fallback.length] })
    })
    return items.sort((a, b) => b.faturamento - a.faturamento)
  }, [filteredOrganicEntries, filteredPaidEntries, selectedOperation, paidProfiles, paidSummary.totalFaturamento])

  const modelRanking = useMemo(() =>
    models.map((model) => {
      const mEntries = organicEntries.filter((e) => e.modeloId === model.id)
      const s = summarizeOrganicPeriod(mEntries)
      return { model, faturamento: s.totalFaturamento, contingencia: s.totalGastos, lucro: s.totalLucro, horas: s.totalHoras, valorHora: s.mediaRealHora, contasRepostas: s.totalContasRepostas || 0 }
    }).sort((a, b) => b.valorHora - a.valorHora),
    [models, organicEntries]
  )

  const profileRanking = useMemo(() =>
    paidProfiles.map((profile) => {
      const pEntries = paidEntries.filter((e) => e.profileId === profile.id)
      const s = summarizePaidPeriod(pEntries)
      return { profile, faturamento: s.totalFaturamento, gastoAds: s.totalGastos, lucro: s.totalLucro, horas: s.totalHoras, valorHora: s.mediaRealHora, roas: s.mediaRoas || 0, roiPercent: s.roiGeralPercent || 0 }
    }).sort((a, b) => b.valorHora - a.valorHora),
    [paidProfiles, paidEntries]
  )

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const activeFilterLabel = useMemo(() => {
    if (selectedEntityId !== 'all') {
      const m = models.find((x) => x.id === selectedEntityId)
      if (m) return m.nome
      const p = paidProfiles.find((x) => x.id === selectedEntityId)
      if (p) return p.nome
    }
    if (selectedOperation === 'organic') return 'Orgânico (OFM)'
    if (selectedOperation === 'paid') return 'Tráfego Pago'
    return 'Todas as Operações'
  }, [selectedOperation, selectedEntityId, models, paidProfiles])

  const hasFilter = selectedOperation !== 'all' || selectedEntityId !== 'all'

  return (
    <div className="space-y-5">

      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {greeting}, Operador.
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            {activeFilterLabel} · {MONTH_NAMES[selectedMonth]} de {selectedYear}
            {totalFaturamento > 0 && (
              <> · <span className="text-emerald-500 font-mono font-medium">{margemGeral.toFixed(1)}% de margem</span></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Dados em tempo real
          </div>
        </div>
      </div>

      {/* ── FILTER BAR — clean pill style ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12] shadow-sm">
        {/* Operation pills */}
        <div className="flex items-center gap-1.5">
          <Pill active={selectedOperation === 'all' && selectedEntityId === 'all'} onClick={() => { setSelectedOperation('all'); setSelectedEntityId('all') }}>
            Consolidado
          </Pill>
          <Pill active={selectedOperation === 'organic'} onClick={() => { setSelectedOperation('organic'); setSelectedEntityId('all') }}>
            Orgânico (OFM)
          </Pill>
          <Pill active={selectedOperation === 'paid'} onClick={() => { setSelectedOperation('paid'); setSelectedEntityId('all') }}>
            Tráfego Pago
          </Pill>
        </div>

        {/* Entity select — posicionado à direita substituindo os botões redundantes */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400 select-none">Filtrar por:</span>
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="h-8 pl-2.5 pr-7 rounded-lg border border-slate-200 dark:border-[#22242D] bg-slate-50 dark:bg-[#16171D] text-[11px] font-medium text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:border-slate-400 appearance-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'calc(100% - 8px) center' }}
          >
            <option value="all">
              {selectedOperation === 'organic' ? 'Todas as Modelos' : selectedOperation === 'paid' ? 'Todas as BMs' : 'Todos'}
            </option>
            {(selectedOperation === 'all' || selectedOperation === 'organic') && (
              <optgroup label="Modelos OFM">
                {models.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </optgroup>
            )}
            {(selectedOperation === 'all' || selectedOperation === 'paid') && (
              <optgroup label="BMs / Perfis">
                {paidProfiles.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </optgroup>
            )}
          </select>

          {hasFilter && (
            <button
              type="button"
              onClick={() => { setSelectedOperation('all'); setSelectedEntityId('all') }}
              className="h-8 px-2.5 rounded-lg text-[11px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              × Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── KPI CARDS — exactly like the reference image ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Faturamento Bruto"
          value={formatCurrency(totalFaturamento)}
          delta={selectedOperation === 'all' ? 'Consolidado' : selectedOperation === 'organic' ? 'OFM' : 'Ads'}
          deltaPositive={true}
          sub={
            selectedOperation === 'all'
              ? `${formatCurrency(organicSummary.totalFaturamento)} orgânico · ${formatCurrency(paidSummary.totalFaturamento)} ads`
              : selectedOperation === 'organic'
              ? 'Receita bruta das redes sociais das modelos'
              : 'Receita bruta das campanhas de anúncios'
          }
        />
        <KpiCard
          label="Custos Operacionais"
          value={formatCurrency(totalGastos)}
          delta={selectedOperation === 'paid' ? `ROAS ${roasMedio.toFixed(2)}×` : `${((totalGastos / Math.max(totalFaturamento, 1)) * 100).toFixed(0)}% do fat.`}
          deltaPositive={false}
          sub={
            selectedOperation === 'paid'
              ? `ROI: ${formatPercent(paidSummary.roiGeralPercent || 0)}`
              : `${organicSummary.totalContasRepostas || 0} contas repostas · ${formatCurrency(paidSummary.totalGastos)} em Ads`
          }
        />
        <KpiCard
          label="Lucro Líquido Real"
          value={formatCurrency(totalLucro)}
          delta={`${margemGeral >= 0 ? '+' : ''}${margemGeral.toFixed(1)}% margem`}
          deltaPositive={totalLucro >= 0}
          sub="Receita líquida após dedução total de custos"
        />
        <KpiCard
          label="Sua Hora Real Média"
          value={`${formatCurrency(mediaRealHoraGeral)}/h`}
          delta="Ponderada"
          deltaPositive={true}
          sub={`${formatHours(totalHoras)} dedicadas no período`}
          accent={true}
        />
      </div>

      {/* ── MAIN CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardPerformanceChart data={dailyPerformanceData} />
        </div>
        <div className="lg:col-span-1">
          <DashboardChannelDonut items={channelShares} totalFaturamento={totalFaturamento} />
        </div>
      </div>

      {/* ── FUNNEL + HOUR GROWTH ── */}
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

      {/* ── RANKING TABLE — full width, like "Top campaigns" in the reference ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12] shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-[#1A1C24]">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {activeRankingTab === 'models' ? 'Top Modelos OFM' : 'Top Perfis de Tráfego Pago'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ordenadas pelo <strong>Retorno Real da sua Hora (R$/h)</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedOperation === 'all' && (
              <div className="flex items-center p-0.5 gap-0.5 rounded-lg bg-slate-100 dark:bg-[#16171D] border border-slate-200 dark:border-[#22242D]">
                <button
                  type="button"
                  onClick={() => setActiveRankingTab('models')}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    activeRankingTab === 'models'
                      ? 'bg-white dark:bg-[#0E0F12] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Modelos ({models.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRankingTab('profiles')}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    activeRankingTab === 'profiles'
                      ? 'bg-white dark:bg-[#0E0F12] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  BMs ({paidProfiles.length})
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate(activeRankingTab === 'models' ? '/organico' : '/pago')}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Ver tudo →
            </button>
          </div>
        </div>

        {/* Models table */}
        {activeRankingTab === 'models' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B0C0E] text-slate-400 dark:text-slate-500 font-medium text-[10px] select-none border-b border-slate-100 dark:border-[#1A1C24]">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Modelo</th>
                  <th className="py-2.5 px-3 text-right">Faturamento</th>
                  <th className="py-2.5 px-3 text-right">Contingência</th>
                  <th className="py-2.5 px-3 text-center">Contas Rep.</th>
                  <th className="py-2.5 px-3 text-right">Lucro</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                  <th className="py-2.5 px-4 text-right text-indigo-500">R$/h</th>
                </tr>
              </thead>
              <tbody>
                {modelRanking.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-[11px]">
                      Nenhuma modelo cadastrada.
                    </td>
                  </tr>
                ) : (
                  modelRanking.map((item, idx) => (
                    <tr
                      key={item.model.id}
                      onClick={() => navigate('/organico')}
                      className={`h-9 cursor-pointer transition-colors hover:bg-indigo-50/70 dark:hover:bg-indigo-500/5 ${
                        idx % 2 === 0
                          ? 'bg-white dark:bg-[#0E0F12]'
                          : 'bg-slate-50/60 dark:bg-[#16171D]'
                      } border-b border-slate-100 dark:border-[#1A1C24] last:border-none`}
                    >
                      <td className="py-1 px-4 text-center text-slate-400 font-mono">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </td>
                      <td className="py-1 px-3 font-semibold text-slate-900 dark:text-white">{item.model.nome}</td>
                      <td className="py-1 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(item.faturamento)}</td>
                      <td className="py-1 px-3 text-right font-mono tabular-nums text-rose-500">{formatCurrency(item.contingencia)}</td>
                      <td className="py-1 px-3 text-center font-mono text-slate-400">{item.contasRepostas}</td>
                      <td className={`py-1 px-3 text-right font-mono font-semibold tabular-nums ${item.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(item.lucro)}
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-slate-400">{formatHours(item.horas)}</td>
                      <td className="py-1 px-4 text-right font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                        {item.horas > 0 ? `${formatCurrency(item.valorHora)}/h` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Profiles table */}
        {activeRankingTab === 'profiles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B0C0E] text-slate-400 dark:text-slate-500 font-medium text-[10px] select-none border-b border-slate-100 dark:border-[#1A1C24]">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Perfil / BM</th>
                  <th className="py-2.5 px-3 text-right">Faturamento</th>
                  <th className="py-2.5 px-3 text-right">Gasto Ads</th>
                  <th className="py-2.5 px-3 text-right">Lucro</th>
                  <th className="py-2.5 px-3 text-right">ROAS</th>
                  <th className="py-2.5 px-3 text-right">ROI %</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                  <th className="py-2.5 px-4 text-right text-indigo-500">R$/h</th>
                </tr>
              </thead>
              <tbody>
                {profileRanking.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-[11px]">
                      Nenhum perfil ou BM cadastrado.
                    </td>
                  </tr>
                ) : (
                  profileRanking.map((item, idx) => (
                    <tr
                      key={item.profile.id}
                      onClick={() => navigate('/pago')}
                      className={`h-9 cursor-pointer transition-colors hover:bg-indigo-50/70 dark:hover:bg-indigo-500/5 ${
                        idx % 2 === 0
                          ? 'bg-white dark:bg-[#0E0F12]'
                          : 'bg-slate-50/60 dark:bg-[#16171D]'
                      } border-b border-slate-100 dark:border-[#1A1C24] last:border-none`}
                    >
                      <td className="py-1 px-4 text-center text-slate-400 font-mono">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </td>
                      <td className="py-1 px-3 font-semibold text-slate-900 dark:text-white">{item.profile.nome}</td>
                      <td className="py-1 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(item.faturamento)}</td>
                      <td className="py-1 px-3 text-right font-mono tabular-nums text-rose-500">{formatCurrency(item.gastoAds)}</td>
                      <td className={`py-1 px-3 text-right font-mono font-semibold tabular-nums ${item.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(item.lucro)}
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{item.roas > 0 ? `${item.roas.toFixed(2)}×` : '—'}</td>
                      <td className="py-1 px-3 text-right font-mono text-slate-400">{item.roiPercent !== 0 ? formatPercent(item.roiPercent) : '—'}</td>
                      <td className="py-1 px-3 text-right font-mono text-slate-400">{formatHours(item.horas)}</td>
                      <td className="py-1 px-4 text-right font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                        {item.horas > 0 ? `${formatCurrency(item.valorHora)}/h` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
