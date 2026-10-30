import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { GatewayConfigCard } from './gateway-config-card'
import { FixedCostsManager } from './fixed-costs-manager'
import { consolidateOrganicFinances } from '@/domain/calculations'
import { formatCurrency, formatHours, formatPercent } from '@/lib/utils'
import { api } from '@/services/index.api'
import { DEFAULT_GATEWAY_CONFIG } from '@/services/storage'
import type { OrganicDailyEntry } from '@/types/analytics'
import type { GatewayConfig, FixedCostItem } from '@/types/finance'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface OrganicFinancialOverviewProps {
  entries: OrganicDailyEntry[]
  selectedModelId: string
  modelName?: string
}

export const OrganicFinancialOverview: React.FC<OrganicFinancialOverviewProps> = ({
  entries,
  selectedModelId,
  modelName = 'Modelo',
}) => {
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>(DEFAULT_GATEWAY_CONFIG)
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>([])
  const [loading, setLoading] = useState(true)

  // Carrega configurações da modelo ativa
  useEffect(() => {
    if (!selectedModelId) return
    let isMounted = true
    async function loadFinanceData() {
      setLoading(true)
      try {
        const [gw, costs] = await Promise.all([
          api.finance.getGatewayConfig(selectedModelId),
          api.finance.getFixedCosts(selectedModelId),
        ])
        if (isMounted) {
          setGatewayConfig(gw)
          setFixedCosts(costs)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadFinanceData()
    return () => {
      isMounted = false
    }
  }, [selectedModelId])

  const isReadOnly = !selectedModelId || selectedModelId === 'all'

  const handleUpdateGateway = (updated: GatewayConfig) => {
    if (isReadOnly) return
    setGatewayConfig(updated)
    api.finance.saveGatewayConfig(selectedModelId, updated)
  }

  const handleAddCost = (item: Omit<FixedCostItem, 'id' | 'criadoEm'>) => {
    if (isReadOnly) return
    const newItem: FixedCostItem = {
      ...item,
      id: `cost_${Date.now()}`,
      criadoEm: new Date().toISOString(),
    }
    const updated = [newItem, ...fixedCosts]
    setFixedCosts(updated)
    api.finance.saveFixedCosts(selectedModelId, updated)
  }

  const handleToggleCost = (id: string) => {
    if (isReadOnly) return
    const updated = fixedCosts.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c))
    setFixedCosts(updated)
    api.finance.saveFixedCosts(selectedModelId, updated)
  }

  const handleDeleteCost = (id: string) => {
    if (isReadOnly) return
    const updated = fixedCosts.filter((c) => c.id !== id)
    setFixedCosts(updated)
    api.finance.saveFixedCosts(selectedModelId, updated)
  }

  const financial = useMemo(() => {
    return consolidateOrganicFinances(entries, gatewayConfig, fixedCosts)
  }, [entries, gatewayConfig, fixedCosts])

  const isProfitPositive = financial.lucroLiquidoReal >= 0

  return (
    <div className="space-y-3 pt-1">
      {/* 1. Fechamento Consolidado Minimalista */}
      <div className="rounded-xl border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E2025]">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Fechamento Real & Margem
            </h2>
            <p className="text-[11px] text-slate-400">
              Faturamento líquido descontando taxas de checkout, contingência e custos fixos
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {modelName}
          </span>
        </div>

        {/* Cards de Métricas em Linha Limpa — Tipografia Uniforme & Indicadores por Seta SVG */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Faturamento Bruto */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025]">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Faturamento
            </span>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{formatCurrency(financial.faturamentoBruto)}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Bruto do mês</span>
          </div>

          {/* Taxas Gateway */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025]">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Gateway
            </span>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
              {gatewayConfig.enabled && financial.gatewayBreakdown.totalRetido > 0 && (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span>
                {gatewayConfig.enabled
                  ? `-${formatCurrency(financial.gatewayBreakdown.totalRetido)}`
                  : 'R$ 0,00'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {gatewayConfig.enabled
                ? `${formatPercent(financial.gatewayBreakdown.effectivePercentage)} efetivo`
                : 'Desativado'}
            </span>
          </div>

          {/* Contingência Diária */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025]">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Contingência
            </span>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
              {financial.totalContingenciaDiaria > 0 && (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span>{formatCurrency(financial.totalContingenciaDiaria)}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {financial.totalContasRepostas} contas
            </span>
          </div>

          {/* Custos Fixos / Setup */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025]">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Custos Fixos / Setup
            </span>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
              {financial.totalCustosExtras > 0 && (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span>{formatCurrency(financial.totalCustosExtras)}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Setup + Mensalidades</span>
          </div>

          {/* Lucro Líquido Real */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025]">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Lucro Líquido Real
            </span>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
              {isProfitPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span>{formatCurrency(financial.lucroLiquidoReal)}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Margem: {formatPercent(financial.margemLiquidaReal)}
            </span>
          </div>

          {/* Sua Hora Real */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025]">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Sua Hora Real
            </span>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white tabular-nums flex items-center gap-1">
              {financial.valorHoraReal >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span>
                {formatCurrency(financial.valorHoraReal)}
                <span className="text-[10px] font-normal text-slate-400">/h</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {financial.totalHoras > 0 ? `${formatHours(financial.totalHoras)} trab.` : 'Sem horas'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Configurações: Gateway e Custos Fixos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <GatewayConfigCard
          config={gatewayConfig}
          breakdown={financial.gatewayBreakdown}
          faturamentoBruto={financial.faturamentoBruto}
          readOnly={isReadOnly}
          onChange={handleUpdateGateway}
        />

        <FixedCostsManager
          modeloId={selectedModelId}
          items={fixedCosts}
          custoInicialAplicado={financial.custoInicialAplicado}
          custoInicialTotal={financial.custoInicialTotal}
          custoFixoMensalTotal={financial.custoFixoMensalTotal}
          onAddItem={handleAddCost}
          onToggleItem={handleToggleCost}
          onDeleteItem={handleDeleteCost}
        />
      </div>
    </div>
  )
}
