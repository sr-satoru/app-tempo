import type {
  CalculatedOrganicDaily,
  CalculatedPaidDaily,
  OrganicDailyEntry,
  PaidDailyEntry,
  PeriodSummary,
} from '@/types/analytics'

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
