import { describe, it, expect } from 'vitest'
import {
  calculateGatewayBreakdown,
  consolidateOrganicFinances,
  calculateOrganicDaily,
  calculatePaidDaily,
  summarizeOrganicPeriod,
  summarizePaidPeriod,
} from '../calculations'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'
import type { GatewayConfig, FixedCostItem } from '@/types/finance'

describe('Auditoria Financeira e Testes de Robustez (Zero-Failure Audit)', () => {
  // 1. Gateway desativado
  it('Auditoria 1: Gateway desativado (enabled: false) nunca retém valores, mesmo com faturamento elevado', () => {
    const config: GatewayConfig = {
      preset: 'kiwify',
      name: 'Kiwify',
      feeType: 'mixed',
      percentageFee: 8.99,
      fixedFeePerTransaction: 2.49,
      estimatedTransactions: 50,
      withdrawalOrMonthlyFee: 10,
      enabled: false,
    }

    const breakdown = calculateGatewayBreakdown(50000, config)
    expect(breakdown.enabled).toBe(false)
    expect(breakdown.percentCost).toBe(0)
    expect(breakdown.fixedTransactionCost).toBe(0)
    expect(breakdown.fixedWithdrawalCost).toBe(0)
    expect(breakdown.totalRetido).toBe(0)
    expect(breakdown.effectivePercentage).toBe(0)
  })

  // 2. Faturamento zero ou negativo
  it('Auditoria 2: Faturamento zerado ou negativo não gera retenção indevida nem NaN', () => {
    const config: GatewayConfig = {
      preset: 'mercadopago',
      name: 'Mercado Pago',
      feeType: 'percentage',
      percentageFee: 4.99,
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 3.5,
      enabled: true,
    }

    const resZero = calculateGatewayBreakdown(0, config)
    expect(resZero.totalRetido).toBe(0)
    expect(resZero.effectivePercentage).toBe(0)
    expect(Number.isNaN(resZero.totalRetido)).toBe(false)

    const resNegativo = calculateGatewayBreakdown(-500, config)
    expect(resNegativo.totalRetido).toBe(0)
    expect(resNegativo.effectivePercentage).toBe(0)
  })

  // 3. Taxa fixa por transação sem transações declaradas
  it('Auditoria 3: Taxa fixa por transação sem transações informadas calcula custo fixo zerado', () => {
    const config: GatewayConfig = {
      preset: 'custom',
      name: 'Personalizado',
      feeType: 'fixed',
      percentageFee: 0,
      fixedFeePerTransaction: 2.5,
      withdrawalOrMonthlyFee: 0,
      enabled: true,
    }

    const breakdown = calculateGatewayBreakdown(1000, config)
    expect(breakdown.fixedTransactionCost).toBe(0)
    expect(breakdown.totalRetido).toBe(0)
  })

  // 4. Gateway apenas com taxa de saque / fixa mensal
  it('Auditoria 4: Gateway operando exclusivamente com taxa de saque/mensalidade isolada', () => {
    const config: GatewayConfig = {
      preset: 'custom',
      name: 'Banco Local',
      feeType: 'fixed',
      percentageFee: 0,
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 15.0,
      enabled: true,
    }

    const breakdown = calculateGatewayBreakdown(1000, config)
    expect(breakdown.percentCost).toBe(0)
    expect(breakdown.fixedTransactionCost).toBe(0)
    expect(breakdown.fixedWithdrawalCost).toBe(15)
    expect(breakdown.totalRetido).toBe(15)
    expect(breakdown.effectivePercentage).toBe(1.5) // 15 / 1000 = 1.5%
  })

  // 5. Custos inativos não são deduzidos
  it('Auditoria 5: Custos inativos (ativo: false) são sumariamente ignorados na consolidação', () => {
    const entries: OrganicDailyEntry[] = [
      {
        id: 'e1',
        data: '2026-10-01',
        modeloId: 'm1',
        canalRedeSocial: 'TikTok',
        horasTrabalhadas: 10,
        faturamento: 2000,
        custoReposicaoContas: 0,
        qtdContasRepostas: 0,
        outrosCustosContingencia: 0,
      },
    ]

    const config: GatewayConfig = {
      preset: 'custom',
      name: 'Custom',
      feeType: 'percentage',
      percentageFee: 0,
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 0,
      enabled: false,
    }

    const costs: FixedCostItem[] = [
      {
        id: 'c1',
        modeloId: 'm1',
        nome: 'Custo Antigo Desativado',
        categoria: 'equipamento',
        tipo: 'inicial',
        valor: 5000,
        amortizarMeses: 1,
        ativo: false, // DESATIVADO
        criadoEm: '2026-10-01',
      },
      {
        id: 'c2',
        modeloId: 'm1',
        nome: 'Software Cancelado',
        categoria: 'software',
        tipo: 'mensal',
        valor: 800,
        ativo: false, // DESATIVADO
        criadoEm: '2026-10-01',
      },
    ]

    const result = consolidateOrganicFinances(entries, config, costs)
    expect(result.custoInicialTotal).toBe(0)
    expect(result.custoInicialAplicado).toBe(0)
    expect(result.custoFixoMensalTotal).toBe(0)
    expect(result.totalCustosExtras).toBe(0)
    expect(result.lucroLiquidoReal).toBe(2000)
  })

  // 6. Amortização com meses inválidos ou zero
  it('Auditoria 6: Amortização com meses inválidos (0, negativo ou undefined) tem fallback seguro de 1 mês', () => {
    const entries: OrganicDailyEntry[] = [
      {
        id: 'e1',
        data: '2026-10-01',
        modeloId: 'm1',
        canalRedeSocial: 'TikTok',
        horasTrabalhadas: 5,
        faturamento: 1000,
        custoReposicaoContas: 0,
        qtdContasRepostas: 0,
        outrosCustosContingencia: 0,
      },
    ]

    const config: GatewayConfig = {
      preset: 'custom',
      name: 'Custom',
      feeType: 'percentage',
      percentageFee: 0,
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 0,
      enabled: false,
    }

    const costs: FixedCostItem[] = [
      {
        id: 'c1',
        modeloId: 'm1',
        nome: 'Item Sem Meses Definidos',
        categoria: 'equipamento',
        tipo: 'inicial',
        valor: 300,
        amortizarMeses: 0, // Invalido: deve virar 1 mes
        ativo: true,
        criadoEm: '2026-10-01',
      },
    ]

    const result = consolidateOrganicFinances(entries, config, costs)
    expect(result.custoInicialTotal).toBe(300)
    expect(result.custoInicialAplicado).toBe(300) // 300 / 1 = 300
    expect(result.lucroLiquidoReal).toBe(700)
  })

  // 7. Amortizações múltiplas com prazos heterogêneos
  it('Auditoria 7: Múltiplos custos iniciais com prazos variados (1x, 3x e 10x) são combinados com exatidão', () => {
    const entries: OrganicDailyEntry[] = [
      {
        id: 'e1',
        data: '2026-10-01',
        modeloId: 'm1',
        canalRedeSocial: 'Instagram',
        horasTrabalhadas: 10,
        faturamento: 3000,
        custoReposicaoContas: 0,
        qtdContasRepostas: 0,
        outrosCustosContingencia: 0,
      },
    ]

    const config: GatewayConfig = {
      preset: 'custom',
      name: 'Custom',
      feeType: 'percentage',
      percentageFee: 0,
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 0,
      enabled: false,
    }

    const costs: FixedCostItem[] = [
      {
        id: 'c1',
        modeloId: 'm1',
        nome: 'Item A (1 mês)',
        categoria: 'outros',
        tipo: 'inicial',
        valor: 100,
        amortizarMeses: 1, // 100 / 1 = 100
        ativo: true,
        criadoEm: '2026-10-01',
      },
      {
        id: 'c2',
        modeloId: 'm1',
        nome: 'Item B (3 meses)',
        categoria: 'equipamento',
        tipo: 'inicial',
        valor: 900,
        amortizarMeses: 3, // 900 / 3 = 300
        ativo: true,
        criadoEm: '2026-10-01',
      },
      {
        id: 'c3',
        modeloId: 'm1',
        nome: 'Item C (10 meses)',
        categoria: 'equipamento',
        tipo: 'inicial',
        valor: 1000,
        amortizarMeses: 10, // 1000 / 10 = 100
        ativo: true,
        criadoEm: '2026-10-01',
      },
    ]

    const result = consolidateOrganicFinances(entries, config, costs)
    expect(result.custoInicialTotal).toBe(2000)
    expect(result.custoInicialAplicado).toBe(500) // 100 + 300 + 100 = 500
    expect(result.lucroLiquidoReal).toBe(2500) // 3000 - 500 = 2500
  })

  // 8. Cenário de prejuízo operacional
  it('Auditoria 8: Cenário de prejuízo operacional (custos > faturamento) preserva margens negativas sem quebras', () => {
    const entries: OrganicDailyEntry[] = [
      {
        id: 'e1',
        data: '2026-10-01',
        modeloId: 'm1',
        canalRedeSocial: 'TikTok',
        horasTrabalhadas: 10,
        faturamento: 500,
        custoReposicaoContas: 400,
        qtdContasRepostas: 4,
        outrosCustosContingencia: 200, // Contingência = 600
      },
    ]

    const config: GatewayConfig = {
      preset: 'mercadopago',
      name: 'Mercado Pago',
      feeType: 'percentage',
      percentageFee: 10, // 50 de taxa
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 0,
      enabled: true,
    }

    const costs: FixedCostItem[] = [
      {
        id: 'c1',
        modeloId: 'm1',
        nome: 'Aluguel Ferramenta',
        categoria: 'software',
        tipo: 'mensal',
        valor: 150,
        ativo: true,
        criadoEm: '2026-10-01',
      },
    ]

    // Faturamento = 500
    // Deduções = 50 (gateway) + 600 (contingência) + 150 (fixo) = 800
    // Lucro Líquido Real = 500 - 800 = -300
    const result = consolidateOrganicFinances(entries, config, costs)
    expect(result.lucroLiquidoReal).toBe(-300)
    expect(result.valorHoraReal).toBe(-30) // -300 / 10
    expect(result.margemLiquidaReal).toBe(-60) // (-300 / 500) * 100 = -60%
  })

  // 9. Entradas com dados sujos ou strings numéricas
  it('Auditoria 9: Entradas com números em formato string ou campos undefined convertem com segurança', () => {
    // Simulando payload vindo de formulário ou JSON despadronizado
    const dirtyEntry: any = {
      id: 'e_dirty',
      data: '2026-10-01',
      modeloId: 'm1',
      canalRedeSocial: 'TikTok',
      horasTrabalhadas: '4', // string
      faturamento: '1200', // string
      custoReposicaoContas: null, // null
      qtdContasRepostas: undefined, // undefined
      outrosCustosContingencia: '50', // string
    }

    const res = calculateOrganicDaily(dirtyEntry)
    expect(res.totalContingencia).toBe(50)
    expect(res.lucroLiquido).toBe(1150)
    expect(res.valorHoraHoje).toBe(287.5) // 1150 / 4
    expect(res.custoMedioPorConta).toBe(0)
    expect(Number.isNaN(res.lucroLiquido)).toBe(false)
  })

  // 10. Auditoria da Invariante Contábil Fundamental
  it('Auditoria 10: Invariante Contábil Fundamental (Faturamento = Lucro Líquido + Deduções Totais)', () => {
    const entries: OrganicDailyEntry[] = [
      {
        id: '1',
        data: '2026-10-01',
        modeloId: 'm1',
        canalRedeSocial: 'TikTok',
        horasTrabalhadas: 12,
        faturamento: 4500,
        custoReposicaoContas: 150,
        qtdContasRepostas: 3,
        outrosCustosContingencia: 80,
      },
      {
        id: '2',
        data: '2026-10-02',
        modeloId: 'm1',
        canalRedeSocial: 'Instagram',
        horasTrabalhadas: 8,
        faturamento: 3500,
        custoReposicaoContas: 100,
        qtdContasRepostas: 2,
        outrosCustosContingencia: 40,
      },
    ]

    const gateway: GatewayConfig = {
      preset: 'kiwify',
      name: 'Kiwify',
      feeType: 'mixed',
      percentageFee: 8.99,
      fixedFeePerTransaction: 2.49,
      estimatedTransactions: 80,
      withdrawalOrMonthlyFee: 3.67,
      enabled: true,
    }

    const costs: FixedCostItem[] = [
      {
        id: 'c1',
        modeloId: 'm1',
        nome: 'iPhone',
        categoria: 'equipamento',
        tipo: 'inicial',
        valor: 1500,
        amortizarMeses: 3,
        ativo: true,
        criadoEm: '2026-10-01',
      },
      {
        id: 'c2',
        modeloId: 'm1',
        nome: 'Software Multilogin',
        categoria: 'software',
        tipo: 'mensal',
        valor: 120,
        ativo: true,
        criadoEm: '2026-10-01',
      },
    ]

    const res = consolidateOrganicFinances(entries, gateway, costs)
    const somaDeducoes =
      res.gatewayBreakdown.totalRetido +
      res.totalContingenciaDiaria +
      res.totalCustosExtras

    // Propriedade fundamental de balanço: Faturamento Bruto === Lucro Líquido + Todas Deduções
    expect(res.lucroLiquidoReal + somaDeducoes).toBeCloseTo(res.faturamentoBruto, 2)
  })

  // 11. Tráfego pago com gasto de Ads zero
  it('Auditoria 11: Tráfego pago com gasto de Ads zero previne Infinity e retorna ROAS zero', () => {
    const entry: PaidDailyEntry = {
      id: 'paid_zero_ads',
      data: '2026-10-05',
      profileId: 'p1',
      horasTrabalhadas: 2,
      faturamento: 1500,
      gastoAds: 0, // Parceria ou influencer sem ads diretos
      outrosGastos: 50,
    }

    const res = calculatePaidDaily(entry)
    expect(res.roas).toBe(0)
    expect(Number.isFinite(res.roas)).toBe(true)
    expect(res.lucroLiquido).toBe(1450)
  })

  // 12. Consolidação de Tráfego Pago com Média Ponderada
  it('Auditoria 12: Média Ponderada Real de Tráfego Pago com dias de volume heterogêneo', () => {
    const entries: PaidDailyEntry[] = [
      {
        id: 'p1',
        data: '2026-10-01',
        profileId: 'prof_1',
        horasTrabalhadas: 2,
        faturamento: 2000,
        gastoAds: 400,
        outrosGastos: 0,
      },
      {
        id: 'p2',
        data: '2026-10-02',
        profileId: 'prof_1',
        horasTrabalhadas: 8,
        faturamento: 500,
        gastoAds: 300,
        outrosGastos: 100,
      },
    ]

    const summary = summarizePaidPeriod(entries)
    expect(summary.totalFaturamento).toBe(2500)
    expect(summary.totalGastos).toBe(800) // (400) + (300 + 100)
    expect(summary.totalLucro).toBe(1700)
    expect(summary.totalHoras).toBe(10)

    // Lucro 1700 / 10h = R$ 170/h (Média real ponderada)
    expect(summary.mediaRealHora).toBe(170)
    // ROAS total: 2500 / 700 = ~3.57x
    expect(summary.mediaRoas).toBeCloseTo(3.57, 2)
    // ROI geral: (1700 / 800) * 100 = 212.5%
    expect(summary.roiGeralPercent).toBe(212.5)
  })
})
