import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { GatewayConfig, GatewayPreset, GatewayFeeType, GatewayBreakdown } from '@/types/finance'
import { ArrowDownRight } from 'lucide-react'

interface GatewayConfigCardProps {
  config: GatewayConfig
  breakdown: GatewayBreakdown
  faturamentoBruto: number
  onChange: (updated: GatewayConfig) => void
}

const PRESET_OPTIONS: {
  id: GatewayPreset
  name: string
  feeType: GatewayFeeType
  percentage: number
  fixed: number
  withdrawal: number
}[] = [
  { id: 'kiwify', name: 'Kiwify (8.99% + R$ 2,49)', feeType: 'mixed', percentage: 8.99, fixed: 2.49, withdrawal: 3.67 },
  { id: 'kirvano', name: 'Kirvano (4.90% + R$ 1,00)', feeType: 'mixed', percentage: 4.90, fixed: 1.00, withdrawal: 0.00 },
  { id: 'hotmart', name: 'Hotmart (9.90% + R$ 1,00)', feeType: 'mixed', percentage: 9.90, fixed: 1.00, withdrawal: 1.99 },
  { id: 'perfectpay', name: 'Perfect Pay (7.90% + R$ 1,50)', feeType: 'mixed', percentage: 7.90, fixed: 1.50, withdrawal: 3.50 },
  { id: 'stripe', name: 'Stripe (3.99% + R$ 0,50)', feeType: 'mixed', percentage: 3.99, fixed: 0.50, withdrawal: 0.00 },
  { id: 'mercadopago', name: 'Mercado Pago (4.99%)', feeType: 'percentage', percentage: 4.99, fixed: 0.00, withdrawal: 0.00 },
  { id: 'custom', name: 'Personalizado', feeType: 'mixed', percentage: 5.00, fixed: 1.00, withdrawal: 0.00 },
]

export const GatewayConfigCard: React.FC<GatewayConfigCardProps> = ({
  config,
  breakdown,
  faturamentoBruto,
  onChange,
}) => {
  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_OPTIONS.find((p) => p.id === presetId)
    if (!found) return
    onChange({
      ...config,
      preset: found.id,
      name: found.name.split(' (')[0],
      feeType: found.feeType,
      percentageFee: found.percentage,
      fixedFeePerTransaction: found.fixed,
      withdrawalOrMonthlyFee: found.withdrawal,
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
    <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
      <CardContent className="p-4 space-y-3">
        {/* Cabeçalho Minimalista */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E2025]">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Taxas do Gateway de Pagamento
            </h3>
            <p className="text-[11px] text-slate-400">
              Checkout e retenções das vendas
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleFieldChange('enabled', !config.enabled)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              config.enabled
                ? 'bg-slate-100 dark:bg-[#1E2025] text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-[#1E2025] text-slate-400'
            }`}
          >
            {config.enabled ? 'Ativo' : 'Desativado'}
          </button>
        </div>

        {/* Linha de Seleção: Gateway + Formato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              Gateway
            </label>
            <select
              value={config.preset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full h-7 rounded px-2 bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025] text-xs text-slate-800 dark:text-slate-200"
            >
              {PRESET_OPTIONS.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#16171F] text-slate-800 dark:text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              Formato de Cobrança
            </label>
            <div className="flex h-7 rounded bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025] p-0.5 text-[11px]">
              {[
                { id: 'mixed', label: 'Misto (% + Fixa)' },
                { id: 'percentage', label: 'Apenas %' },
                { id: 'fixed', label: 'Apenas Fixa' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleFeeTypeChange(t.id as GatewayFeeType)}
                  className={`flex-1 rounded transition-colors ${
                    config.feeType === t.id
                      ? 'bg-white dark:bg-[#22242F] text-slate-900 dark:text-slate-100 font-medium shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inputs de Configuração */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {(config.feeType === 'percentage' || config.feeType === 'mixed') && (
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                Taxa %
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.percentageFee || ''}
                  onChange={(e) => handleFieldChange('percentageFee', e.target.value)}
                  className="w-full h-7 rounded px-2 pr-5 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs font-mono text-slate-800 dark:text-slate-200"
                  placeholder="0.00"
                />
                <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">%</span>
              </div>
            </div>
          )}

          {(config.feeType === 'fixed' || config.feeType === 'mixed') && (
            <div>
              <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                Taxa Fixa / Venda
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={config.fixedFeePerTransaction || ''}
                onChange={(e) => handleFieldChange('fixedFeePerTransaction', e.target.value)}
                className="w-full h-7 rounded px-2 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs font-mono text-slate-800 dark:text-slate-200"
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
              Saque / Fixa Mensal
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.withdrawalOrMonthlyFee || ''}
              onChange={(e) => handleFieldChange('withdrawalOrMonthlyFee', e.target.value)}
              className="w-full h-7 rounded px-2 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs font-mono text-slate-800 dark:text-slate-200"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Linha Resumo Minimalista */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1E2025] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
          <div>
            Faturamento: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(faturamentoBruto)}</span>
          </div>

          <div>
            Retenção:{' '}
            <span className="text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-0.5">
              {config.enabled && breakdown.totalRetido > 0 && (
                <ArrowDownRight className="w-3 h-3 text-rose-500 shrink-0" />
              )}
              {config.enabled ? `-${formatCurrency(breakdown.totalRetido)}` : 'R$ 0,00'}
            </span>
            {config.enabled && breakdown.effectivePercentage > 0 && (
              <span className="text-slate-400 ml-1">({formatPercent(breakdown.effectivePercentage)})</span>
            )}
          </div>

          <div>
            Líquido:{' '}
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {formatCurrency(faturamentoBruto - (config.enabled ? breakdown.totalRetido : 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
