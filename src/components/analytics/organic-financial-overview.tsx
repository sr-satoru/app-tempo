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
import {
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react'

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

  // Carrega configurações de gateway e custos fixos para a modelo ativa
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

  // Salvar Gateway
  const handleUpdateGateway = (updated: GatewayConfig) => {
    setGatewayConfig(updated)
    api.finance.saveGatewayConfig(selectedModelId, updated)
  }

  // Adicionar Custo
  const handleAddCost = (item: Omit<FixedCostItem, 'id' | 'criadoEm'>) => {
    const newItem: FixedCostItem = {
      ...item,
      id: `cost_${Date.now()}`,
      criadoEm: new Date().toISOString(),
    }
    const updated = [newItem, ...fixedCosts]
    setFixedCosts(updated)
    api.finance.saveFixedCosts(selectedModelId, updated)
  }

  // Ativar/Desativar Custo
  const handleToggleCost = (id: string) => {
    const updated = fixedCosts.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c))
    setFixedCosts(updated)
    api.finance.saveFixedCosts(selectedModelId, updated)
  }

  // Deletar Custo
  const handleDeleteCost = (id: string) => {
    const updated = fixedCosts.filter((c) => c.id !== id)
    setFixedCosts(updated)
    api.finance.saveFixedCosts(selectedModelId, updated)
  }

  // Cálculo Geral Consolidado (100% puro e reativo)
  const financial = useMemo(() => {
    return consolidateOrganicFinances(entries, gatewayConfig, fixedCosts)
  }, [entries, gatewayConfig, fixedCosts])

  // Lucro bruto preliminar (apenas faturamento - contingência da planilha) para comparação
  const lucroSemExtras =
    financial.faturamentoBruto - financial.totalContingenciaDiaria
  const valorHoraSemExtras =
    financial.totalHoras > 0 ? lucroSemExtras / financial.totalHoras : 0

  const isProfitPositive = financial.lucroLiquidoReal >= 0

  return (
    <div className="space-y-4 pt-2">
      {/* ======================================================== */}
      {/* 1. SEÇÃO DE FECHAMENTO FINANCEIRO REAL (RESUMO CONSOLIDADO) */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E2025] bg-gradient-to-b from-slate-50/50 to-white dark:from-[#14151B] dark:to-[#0F1014] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-[#1E2025]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Fechamento Financeiro Real & Margem Líquida
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-[#1E2025] text-slate-600 dark:text-slate-300 font-medium">
                {modelName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Faturamento bruto descontando taxas de checkout, contingência diária e custos fixos/iniciais
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Cálculo Atualizado ao Vivo
          </div>
        </div>

        {/* Grade de Cards de Fechamento */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Faturamento Bruto */}
          <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
            <CardContent className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Faturamento Bruto
              </span>
              <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {formatCurrency(financial.faturamentoBruto)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">Total das vendas</span>
            </CardContent>
          </Card>

          {/* Card 2: Total Retido pelo Gateway */}
          <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
            <CardContent className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
                <span>Taxas Gateway</span>
                {gatewayConfig.enabled && (
                  <span className="text-[10px] lowercase font-mono">
                    {formatPercent(financial.gatewayBreakdown.effectivePercentage)}
                  </span>
                )}
              </span>
              <div className="text-lg sm:text-2xl font-bold text-rose-500 font-mono tabular-nums">
                {gatewayConfig.enabled
                  ? `-${formatCurrency(financial.gatewayBreakdown.totalRetido)}`
                  : 'R$ 0,00'}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1 truncate">
                {gatewayConfig.enabled
                  ? `${gatewayConfig.name} (${gatewayConfig.feeType === 'percentage' ? `${gatewayConfig.percentageFee}%` : `${gatewayConfig.percentageFee}% + R$${gatewayConfig.fixedFeePerTransaction}`})`
                  : 'Sem gateway aplicado'}
              </span>
            </CardContent>
          </Card>

          {/* Card 3: Contingência Operacional (Tabela) */}
          <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
            <CardContent className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Contingência Diária
              </span>
              <div className="text-lg sm:text-2xl font-bold text-rose-500 font-mono tabular-nums">
                {formatCurrency(financial.totalContingenciaDiaria)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1 truncate">
                {financial.totalContasRepostas} contas repostas
              </span>
            </CardContent>
          </Card>

          {/* Card 4: Custos Iniciais & Fixos */}
          <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
            <CardContent className="p-3.5 sm:p-4">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Custos Extras / Setup
              </span>
              <div className="text-lg sm:text-2xl font-bold text-rose-500 font-mono tabular-nums">
                {formatCurrency(financial.totalCustosExtras)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1 truncate">
                Setup + Mensalidades
              </span>
            </CardContent>
          </Card>

          {/* Card 5: ⭐ LUCRO LÍQUIDO REAL */}
          <Card
            className={`border col-span-2 sm:col-span-1 shadow-sm transition-all ${
              isProfitPositive
                ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                : 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10'
            }`}
          >
            <CardContent className="p-3.5 sm:p-4">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isProfitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                Lucro Líquido Real
              </span>
              <div
                className={`text-lg sm:text-2xl font-extrabold font-mono tabular-nums ${
                  isProfitPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                {formatCurrency(financial.lucroLiquidoReal)}
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-1">
                Margem: {formatPercent(financial.margemLiquidaReal)}
              </span>
            </CardContent>
          </Card>

          {/* Card 6: ⭐ VALOR REAL DA HORA */}
          <Card className="border border-[#7C3AED]/40 bg-[#7C3AED]/5 dark:bg-[#7C3AED]/10 col-span-2 sm:col-span-1 shadow-sm">
            <CardContent className="p-3.5 sm:p-4">
              <span className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider block mb-1">
                Sua Hora Real
              </span>
              <div className="text-lg sm:text-2xl font-extrabold text-[#7C3AED] dark:text-[#C4B5FD] font-mono tabular-nums">
                {formatCurrency(financial.valorHoraReal)}
                <span className="text-xs font-normal text-slate-500">/h</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 truncate">
                {financial.totalHoras > 0 ? `${formatHours(financial.totalHoras)} dedicadas` : 'Sem horas no mês'}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Faixa explicativa de conciliação */}
        <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-[#171822] border border-slate-200/80 dark:border-[#222432] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">Fluxo do Dinheiro:</span>
            <span>Faturamento ({formatCurrency(financial.faturamentoBruto)})</span>
            <span className="text-slate-400">−</span>
            <span>Gateway ({formatCurrency(financial.gatewayBreakdown.totalRetido)})</span>
            <span className="text-slate-400">−</span>
            <span>Contingência ({formatCurrency(financial.totalContingenciaDiaria)})</span>
            <span className="text-slate-400">−</span>
            <span>Custos Fixos/Setup ({formatCurrency(financial.totalCustosExtras)})</span>
            <span className="text-slate-400">=</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              Lucro Real ({formatCurrency(financial.lucroLiquidoReal)})
            </span>
          </div>

          {valorHoraSemExtras > 0 && financial.valorHoraReal !== valorHoraSemExtras && (
            <div className="text-[11px] font-mono text-slate-500">
              Valor da hora sem taxas seria: {formatCurrency(valorHoraSemExtras)}/h
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRADE DE GESTÃO: GATEWAY (ESQUERDA) + CUSTOS FIXOS (DIREITA) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Painel do Gateway */}
        <GatewayConfigCard
          config={gatewayConfig}
          breakdown={financial.gatewayBreakdown}
          faturamentoBruto={financial.faturamentoBruto}
          onChange={handleUpdateGateway}
        />

        {/* Painel de Custos Fixos & Iniciais */}
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
