import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { GatewayConfig, GatewayPreset, GatewayFeeType, GatewayBreakdown } from '@/types/finance'
import { CreditCard, Check, Sliders, DollarSign, Percent, ArrowRight } from 'lucide-react'

interface GatewayConfigCardProps {
  config: GatewayConfig
  breakdown: GatewayBreakdown
  faturamentoBruto: number
  onChange: (updated: GatewayConfig) => void
}

const PRESETS: {
  id: GatewayPreset
  name: string
  feeType: GatewayFeeType
  percentage: number
  fixed: number
  withdrawal: number
  badge: string
}[] = [
  {
    id: 'kiwify',
    name: 'Kiwify',
    feeType: 'mixed',
    percentage: 8.99,
    fixed: 2.49,
    withdrawal: 3.67,
    badge: 'Popular',
  },
  {
    id: 'kirvano',
    name: 'Kirvano',
    feeType: 'mixed',
    percentage: 4.90,
    fixed: 1.00,
    withdrawal: 0.00,
    badge: 'Taxa Baixa',
  },
  {
    id: 'hotmart',
    name: 'Hotmart',
    feeType: 'mixed',
    percentage: 9.90,
    fixed: 1.00,
    withdrawal: 1.99,
    badge: 'Global',
  },
  {
    id: 'perfectpay',
    name: 'Perfect Pay',
    feeType: 'mixed',
    percentage: 7.90,
    fixed: 1.50,
    withdrawal: 3.50,
    badge: 'Checkout',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    feeType: 'mixed',
    percentage: 3.99,
    fixed: 0.50,
    withdrawal: 0.00,
    badge: 'Internacional',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    feeType: 'percentage',
    percentage: 4.99,
    fixed: 0.00,
    withdrawal: 0.00,
    badge: 'Pix / Cartão',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    feeType: 'mixed',
    percentage: 5.00,
    fixed: 1.00,
    withdrawal: 0.00,
    badge: 'Livre',
  },
]

export const GatewayConfigCard: React.FC<GatewayConfigCardProps> = ({
  config,
  breakdown,
  faturamentoBruto,
  onChange,
}) => {
  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    onChange({
      ...config,
      preset: preset.id,
      name: preset.name,
      feeType: preset.feeType,
      percentageFee: preset.percentage,
      fixedFeePerTransaction: preset.fixed,
      withdrawalOrMonthlyFee: preset.withdrawal,
    })
  }

  const handleFeeTypeChange = (feeType: GatewayFeeType) => {
    onChange({
      ...config,
      feeType,
      preset: 'custom',
    })
  }

  const handleFieldChange = (field: keyof GatewayConfig, val: string | number | boolean) => {
    onChange({
      ...config,
      [field]: typeof config[field] === 'number' ? Number(val) || 0 : val,
      preset: field === 'enabled' ? config.preset : 'custom',
    })
  }

  return (
    <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Cabeçalho do Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-[#1E2025]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Taxas do Gateway de Pagamento
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C4B5FD]">
                  Checkout & Processamento
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure as taxas cobradas na sua plataforma de vendas
              </p>
            </div>
          </div>

          {/* Toggle Ativo/Inativo */}
          <button
            type="button"
            onClick={() => handleFieldChange('enabled', !config.enabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              config.enabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-100 dark:bg-[#1E2025] text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {config.enabled ? 'Taxas Ativas no Resumo' : 'Desativado'}
          </button>
        </div>

        {/* 1. Presets Rápidos */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Plataforma / Gateway Selecionado:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {PRESETS.map((p) => {
              const isSelected = config.preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2 rounded-lg text-left text-xs transition-all relative border flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-slate-900 dark:text-white shadow-sm'
                      : 'border-slate-200 dark:border-[#1E2025] bg-slate-50/50 dark:bg-[#16171E] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold truncate">{p.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.feeType === 'percentage'
                      ? `${p.percentage}%`
                      : p.feeType === 'fixed'
                      ? `R$ ${p.fixed}`
                      : `${p.percentage}% + R$${p.fixed}`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Tipo de Cobrança (Misto, Apenas %, Apenas Fixo) */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Formato da Taxa:
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'mixed', label: 'Misto (% + Taxa Fixa por Venda)' },
              { id: 'percentage', label: 'Apenas Porcentagem (%)' },
              { id: 'fixed', label: 'Apenas Taxa Fixa (R$)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleFeeTypeChange(t.id as GatewayFeeType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  config.feeType === t.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-[#1A1C24] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Inputs de Valores Configuráveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Taxa % */}
          {(config.feeType === 'percentage' || config.feeType === 'mixed') && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                <Percent className="w-3 h-3 text-[#7C3AED]" />
                Taxa Percentual (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.percentageFee || ''}
                  onChange={(e) => handleFieldChange('percentageFee', e.target.value)}
                  className="w-full h-8.5 rounded-lg pl-3 pr-7 bg-slate-50 dark:bg-[#16171E] border border-slate-200 dark:border-[#1E2025] focus:border-[#7C3AED] text-xs font-mono font-medium text-slate-900 dark:text-white"
                  placeholder="0.00"
                />
                <span className="absolute right-2.5 top-2 text-xs text-slate-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Sobre o faturamento bruto</span>
            </div>
          )}

          {/* Taxa Fixa por Transação */}
          {(config.feeType === 'fixed' || config.feeType === 'mixed') && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                Taxa Fixa / Venda (R$)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.fixedFeePerTransaction || ''}
                  onChange={(e) => handleFieldChange('fixedFeePerTransaction', e.target.value)}
                  className="w-full h-8.5 rounded-lg pl-8 pr-3 bg-slate-50 dark:bg-[#16171E] border border-slate-200 dark:border-[#1E2025] focus:border-[#7C3AED] text-xs font-mono font-medium text-slate-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Cobrado a cada venda/checkout</span>
            </div>
          )}

          {/* Ticket Médio Estimado */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
              <Sliders className="w-3 h-3 text-blue-500" />
              Ticket Médio Estimado (R$)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
              <input
                type="number"
                step="1"
                min="1"
                value={config.averageTicket || ''}
                onChange={(e) => handleFieldChange('averageTicket', e.target.value)}
                className="w-full h-8.5 rounded-lg pl-8 pr-3 bg-slate-50 dark:bg-[#16171E] border border-slate-200 dark:border-[#1E2025] focus:border-[#7C3AED] text-xs font-mono font-medium text-slate-900 dark:text-white"
                placeholder="47"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {breakdown.estimatedTransactionsCount > 0
                ? `Estima ~${breakdown.estimatedTransactionsCount} vendas no mês`
                : 'Para estimar quantidade de vendas'}
            </span>
          </div>

          {/* Taxa de Saque / Custo Fixo Plataforma */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-amber-500" />
              Taxa Saque / Fixa Mensal (R$)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={config.withdrawalOrMonthlyFee || ''}
                onChange={(e) => handleFieldChange('withdrawalOrMonthlyFee', e.target.value)}
                className="w-full h-8.5 rounded-lg pl-8 pr-3 bg-slate-50 dark:bg-[#16171E] border border-slate-200 dark:border-[#1E2025] focus:border-[#7C3AED] text-xs font-mono font-medium text-slate-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Taxa de saque bancário ou mensalidade</span>
          </div>
        </div>

        {/* 4. Mini Painel de Impacto Financeiro do Gateway */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171821] border border-slate-200 dark:border-[#222430] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block">Faturamento Bruto:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                {formatCurrency(faturamentoBruto)}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />

            <div>
              <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium block">
                (-) Retenção Total Gateway:
              </span>
              <span className="font-mono font-bold text-rose-500 text-sm">
                {config.enabled ? formatCurrency(breakdown.totalRetido) : 'R$ 0,00'}
              </span>
              {config.enabled && breakdown.effectivePercentage > 0 && (
                <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                  ({formatPercent(breakdown.effectivePercentage)} efetivo)
                </span>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />

            <div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                (=) Líquido Liberado pelo Gateway:
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(faturamentoBruto - (config.enabled ? breakdown.totalRetido : 0))}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono bg-white dark:bg-[#121316] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430]">
            {config.feeType === 'mixed' && (
              <span>
                % ({formatCurrency(breakdown.percentCost)}) + Vendas (
                {formatCurrency(breakdown.fixedTransactionCost)})
              </span>
            )}
            {config.feeType === 'percentage' && (
              <span>Taxa percentual direta: {formatCurrency(breakdown.percentCost)}</span>
            )}
            {config.feeType === 'fixed' && (
              <span>
                {breakdown.estimatedTransactionsCount} transações x{' '}
                {formatCurrency(config.fixedFeePerTransaction)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
