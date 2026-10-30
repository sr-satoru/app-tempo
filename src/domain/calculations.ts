import type {
  CalculatedOrganicDaily,
  CalculatedPaidDaily,
  OrganicDailyEntry,
  PaidDailyEntry,
  PeriodSummary,
} from '@/types/analytics'
import type {
  GatewayConfig,
  FixedCostItem,
  GatewayBreakdown,
  FinancialConsolidation,
} from '@/types/finance'

/**
 * Cálculos Diários para Tráfego Orgânico (OFM / Contingência)
 */
export function calculateOrganicDaily(entry: OrganicDailyEntry): CalculatedOrganicDaily {
  const faturamento = Number(entry.faturamento) || 0
  const horas = Number(entry.horasTrabalhadas) || 0
  const custoReposicao = Number(entry.custoReposicaoContas) || 0
  const qtdContas = Number(entry.qtdContasRepostas) || 0
  const outrosCustos = Number(entry.outrosCustosContingencia) || 0

  const totalContingencia = custoReposicao + outrosCustos
  const lucroLiquido = faturamento - totalContingencia

  // Valor da hora hoje (protegido contra divisão por zero)
  const valorHoraHoje = horas > 0 ? lucroLiquido / horas : 0

  // Custo médio por conta reposta
  const custoMedioPorConta = qtdContas > 0 ? custoReposicao / qtdContas : 0

  // Margem de lucro (%)
  const margemLucroPercent = faturamento > 0 ? (lucroLiquido / faturamento) * 100 : 0

  return {
    entry,
    totalContingencia,
    lucroLiquido,
    valorHoraHoje,
    custoMedioPorConta,
    margemLucroPercent,
  }
}

/**
 * Cálculos Diários para Tráfego Pago (Ads / BMs)
 */
export function calculatePaidDaily(entry: PaidDailyEntry): CalculatedPaidDaily {
  const faturamento = Number(entry.faturamento) || 0
  const horas = Number(entry.horasTrabalhadas) || 0
  const gastoAds = Number(entry.gastoAds) || 0
  const outrosGastos = Number(entry.outrosGastos) || 0

  const totalGastos = gastoAds + outrosGastos
  const lucroLiquido = faturamento - totalGastos

  // Valor da hora hoje
  const valorHoraHoje = horas > 0 ? lucroLiquido / horas : 0

  // ROAS (Faturamento / Gasto com Ads)
  const roas = gastoAds > 0 ? faturamento / gastoAds : 0

  // ROI % (Lucro / Total Gastos * 100)
  const roiPercent = totalGastos > 0 ? (lucroLiquido / totalGastos) * 100 : 0

  // Margem de lucro (%)
  const margemLucroPercent = faturamento > 0 ? (lucroLiquido / faturamento) * 100 : 0

  return {
    entry,
    totalGastos,
    lucroLiquido,
    valorHoraHoje,
    roas,
    roiPercent,
    margemLucroPercent,
  }
}

/**
 * Cálculo Consolidado do Período para Orgânico
 * Implementa a MÉDIA PONDERADA REAL: Soma(Lucro) / Soma(Horas)
 */
export function summarizeOrganicPeriod(entries: OrganicDailyEntry[]): PeriodSummary {
  const totalFaturamento = entries.reduce((acc, e) => acc + (Number(e.faturamento) || 0), 0)
  const totalReposicao = entries.reduce((acc, e) => acc + (Number(e.custoReposicaoContas) || 0), 0)
  const totalOutros = entries.reduce((acc, e) => acc + (Number(e.outrosCustosContingencia) || 0), 0)
  const totalGastos = totalReposicao + totalOutros
  const totalLucro = totalFaturamento - totalGastos
  const totalHoras = entries.reduce((acc, e) => acc + (Number(e.horasTrabalhadas) || 0), 0)
  const totalContas = entries.reduce((acc, e) => acc + (Number(e.qtdContasRepostas) || 0), 0)

  // Média Ponderada Real: Total do Lucro / Total de Horas
  const mediaRealHora = totalHoras > 0 ? totalLucro / totalHoras : 0
  const custoMedioContaGeral = totalContas > 0 ? totalReposicao / totalContas : 0
  const roiGeralPercent = totalGastos > 0 ? (totalLucro / totalGastos) * 100 : 0

  return {
    totalFaturamento,
    totalGastos,
    totalLucro,
    totalHoras,
    mediaRealHora,
    roiGeralPercent,
    totalContasRepostas: totalContas,
    custoMedioContaGeral,
  }
}

/**
 * Cálculo Consolidado do Período para Pago
 * Implementa a MÉDIA PONDERADA REAL: Soma(Lucro) / Soma(Horas)
 */
export function summarizePaidPeriod(entries: PaidDailyEntry[]): PeriodSummary {
  const totalFaturamento = entries.reduce((acc, e) => acc + (Number(e.faturamento) || 0), 0)
  const totalAds = entries.reduce((acc, e) => acc + (Number(e.gastoAds) || 0), 0)
  const totalOutros = entries.reduce((acc, e) => acc + (Number(e.outrosGastos) || 0), 0)
  const totalGastos = totalAds + totalOutros
  const totalLucro = totalFaturamento - totalGastos
  const totalHoras = entries.reduce((acc, e) => acc + (Number(e.horasTrabalhadas) || 0), 0)

  // Média Ponderada Real
  const mediaRealHora = totalHoras > 0 ? totalLucro / totalHoras : 0
  const mediaRoas = totalAds > 0 ? totalFaturamento / totalAds : 0
  const roiGeralPercent = totalGastos > 0 ? (totalLucro / totalGastos) * 100 : 0

  return {
    totalFaturamento,
    totalGastos,
    totalLucro,
    totalHoras,
    mediaRealHora,
    mediaRoas,
    roiGeralPercent,
  }
}

/**
 * Cálculo das Deduções e Retenções de Gateway de Pagamento
 */
export function calculateGatewayBreakdown(
  faturamento: number,
  config: GatewayConfig
): GatewayBreakdown {
  if (!config.enabled || faturamento <= 0) {
    return {
      enabled: config.enabled,
      percentCost: 0,
      fixedTransactionCost: 0,
      fixedWithdrawalCost: 0,
      totalRetido: 0,
      effectivePercentage: 0,
      estimatedTransactionsCount: 0,
    }
  }

  let estimatedTransactionsCount = 0
  if (config.estimatedTransactions && config.estimatedTransactions > 0) {
    estimatedTransactionsCount = config.estimatedTransactions
  }

  let percentCost = 0
  let fixedTransactionCost = 0

  if (config.feeType === 'percentage' || config.feeType === 'mixed') {
    percentCost = (faturamento * (config.percentageFee || 0)) / 100
  }

  if (config.feeType === 'fixed' || config.feeType === 'mixed') {
    fixedTransactionCost = estimatedTransactionsCount * (config.fixedFeePerTransaction || 0)
  }

  const fixedWithdrawalCost = Number(config.withdrawalOrMonthlyFee) || 0
  const totalRetido = percentCost + fixedTransactionCost + fixedWithdrawalCost
  const effectivePercentage = faturamento > 0 ? (totalRetido / faturamento) * 100 : 0

  return {
    enabled: config.enabled,
    percentCost,
    fixedTransactionCost,
    fixedWithdrawalCost,
    totalRetido,
    effectivePercentage,
    estimatedTransactionsCount,
  }
}

/**
 * Consolidação Financeira Geral com Lucro Líquido Real, Gateway e Custos Fixos/Iniciais
 */
export function consolidateOrganicFinances(
  entries: OrganicDailyEntry[],
  gatewayConfig: GatewayConfig,
  fixedCosts: FixedCostItem[]
): FinancialConsolidation {
  const totalFaturamento = entries.reduce((acc, e) => acc + (Number(e.faturamento) || 0), 0)
  const totalHoras = entries.reduce((acc, e) => acc + (Number(e.horasTrabalhadas) || 0), 0)
  const totalReposicao = entries.reduce((acc, e) => acc + (Number(e.custoReposicaoContas) || 0), 0)
  const totalOutros = entries.reduce((acc, e) => acc + (Number(e.outrosCustosContingencia) || 0), 0)
  const totalContingenciaDiaria = totalReposicao + totalOutros
  const totalContasRepostas = entries.reduce((acc, e) => acc + (Number(e.qtdContasRepostas) || 0), 0)
  const custoMedioContaDiaria = totalContasRepostas > 0 ? totalReposicao / totalContasRepostas : 0

  // Dedução de Gateway
  const gatewayBreakdown = calculateGatewayBreakdown(totalFaturamento, gatewayConfig)

  // Custos Iniciais & Custos Fixos
  const activeCosts = (fixedCosts || []).filter((c) => c.ativo)

  let custoInicialTotal = 0
  let custoInicialAplicado = 0
  let custoFixoMensalTotal = 0

  for (const item of activeCosts) {
    const val = Number(item.valor) || 0
    if (item.tipo === 'inicial') {
      custoInicialTotal += val
      const meses = Math.max(1, item.amortizarMeses || 1)
      custoInicialAplicado += val / meses
    } else {
      custoFixoMensalTotal += val
    }
  }

  const totalCustosExtras = custoInicialAplicado + custoFixoMensalTotal
  const totalDeducoes = gatewayBreakdown.totalRetido + totalContingenciaDiaria + totalCustosExtras
  const lucroLiquidoReal = totalFaturamento - totalDeducoes
  const valorHoraReal = totalHoras > 0 ? lucroLiquidoReal / totalHoras : 0
  const margemLiquidaReal = totalFaturamento > 0 ? (lucroLiquidoReal / totalFaturamento) * 100 : 0
  const roiRealPercent = totalDeducoes > 0 ? (lucroLiquidoReal / totalDeducoes) * 100 : 0

  return {
    faturamentoBruto: totalFaturamento,
    totalHoras,
    totalContingenciaDiaria,
    totalContasRepostas,
    custoMedioContaDiaria,
    gatewayBreakdown,
    custoInicialAplicado,
    custoInicialTotal,
    custoFixoMensalTotal,
    totalCustosExtras,
    lucroLiquidoReal,
    valorHoraReal,
    margemLiquidaReal,
    roiRealPercent,
  }
}

