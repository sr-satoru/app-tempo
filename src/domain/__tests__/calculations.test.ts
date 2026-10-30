import { describe, it, expect } from 'vitest'
import {
  calculateOrganicDaily,
  calculatePaidDaily,
  summarizeOrganicPeriod,
  summarizePaidPeriod,
  calculateGatewayBreakdown,
  consolidateOrganicFinances,
} from '../calculations'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'

describe('Motor Matemático: Cálculos Diários e Acumulados', () => {
  it('deve calcular corretamente o lucro e valor da hora no orgânico OFM', () => {
    const entry: OrganicDailyEntry = {
      id: 'test_1',
      data: '2026-10-30',
      modeloId: 'mod_1',
      canalRedeSocial: 'TikTok',
      horasTrabalhadas: 5,
      faturamento: 600,
      custoReposicaoContas: 100,
      qtdContasRepostas: 2,
      outrosCustosContingencia: 50,
    }

    const res = calculateOrganicDaily(entry)
    expect(res.totalContingencia).toBe(150)
    expect(res.lucroLiquido).toBe(450)
    expect(res.valorHoraHoje).toBe(90) // 450 / 5
    expect(res.custoMedioPorConta).toBe(50) // 100 / 2
  })

  it('deve proteger com segurança contra divisão por zero quando horas forem 0', () => {
    const entry: OrganicDailyEntry = {
      id: 'test_2',
      data: '2026-10-31',
      modeloId: 'mod_1',
      canalRedeSocial: 'Instagram',
      horasTrabalhadas: 0,
      faturamento: 300,
      custoReposicaoContas: 0,
      qtdContasRepostas: 0,
      outrosCustosContingencia: 0,
    }

    const res = calculateOrganicDaily(entry)
    expect(res.valorHoraHoje).toBe(0)
    expect(res.custoMedioPorConta).toBe(0)
  })

  it('deve calcular corretamente ROAS e ROI no tráfego pago', () => {
    const entry: PaidDailyEntry = {
      id: 'test_paid_1',
      data: '2026-10-30',
      profileId: 'prof_1',
      horasTrabalhadas: 4,
      faturamento: 1200,
      gastoAds: 300,
      outrosGastos: 100,
    }

    const res = calculatePaidDaily(entry)
    expect(res.totalGastos).toBe(400)
    expect(res.lucroLiquido).toBe(800)
    expect(res.roas).toBe(4) // 1200 / 300
    expect(res.roiPercent).toBe(200) // (800 / 400) * 100
    expect(res.valorHoraHoje).toBe(200) // 800 / 4
  })

  it('deve calcular a MÉDIA PONDERADA REAL da hora e não uma média aritmética simples', () => {
    // Dia 1: Trabalhou 1h e lucrou R$ 100 (R$ 100/h)
    // Dia 2: Trabalhou 10h e lucrou R$ 400 (R$ 40/h)
    // Média aritmética simples daria: (100 + 40) / 2 = R$ 70/h (DISTORÇÃO!)
    // Média ponderada real: Total Lucro (500) / Total Horas (11) = R$ 45.45/h (CORRETO!)
    const entries: OrganicDailyEntry[] = [
      {
        id: '1',
        data: '2026-10-01',
        modeloId: 'mod_1',
        canalRedeSocial: 'TikTok',
        horasTrabalhadas: 1,
        faturamento: 100,
        custoReposicaoContas: 0,
        qtdContasRepostas: 0,
        outrosCustosContingencia: 0,
      },
      {
        id: '2',
        data: '2026-10-02',
        modeloId: 'mod_1',
        canalRedeSocial: 'TikTok',
        horasTrabalhadas: 10,
        faturamento: 400,
        custoReposicaoContas: 0,
        qtdContasRepostas: 0,
        outrosCustosContingencia: 0,
      },
    ]

    const summary = summarizeOrganicPeriod(entries)
    expect(summary.totalLucro).toBe(500)
    expect(summary.totalHoras).toBe(11)
    expect(summary.mediaRealHora).toBeCloseTo(45.45, 2)
  })

  it('deve calcular corretamente taxas de gateway (apenas %, apenas fixa e mista)', () => {
    // 1. Apenas Porcentagem
    const resPercent = calculateGatewayBreakdown(1000, {
      preset: 'mercadopago',
      name: 'Mercado Pago',
      feeType: 'percentage',
      percentageFee: 4.99,
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 0,
      enabled: true,
    })
    expect(resPercent.percentCost).toBe(49.9)
    expect(resPercent.fixedTransactionCost).toBe(0)
    expect(resPercent.totalRetido).toBe(49.9)

    // 2. Apenas Taxa Fixa por transação (ex: 20 transações com taxa de R$ 2.0)
    const resFixed = calculateGatewayBreakdown(1000, {
      preset: 'custom',
      name: 'Custom',
      feeType: 'fixed',
      percentageFee: 0,
      fixedFeePerTransaction: 2.0,
      estimatedTransactions: 20,
      withdrawalOrMonthlyFee: 5,
      enabled: true,
    })
    expect(resFixed.percentCost).toBe(0)
    expect(resFixed.estimatedTransactionsCount).toBe(20)
    expect(resFixed.fixedTransactionCost).toBe(40) // 20 * 2
    expect(resFixed.totalRetido).toBe(45) // 40 + 5 saque

    // 3. Mista (ex: Kiwify 8.99% + R$ 2.49)
    const resMixed = calculateGatewayBreakdown(1000, {
      preset: 'kiwify',
      name: 'Kiwify',
      feeType: 'mixed',
      percentageFee: 8.99,
      fixedFeePerTransaction: 2.49,
      estimatedTransactions: 20,
      withdrawalOrMonthlyFee: 3.67,
      enabled: true,
    })
    expect(resMixed.percentCost).toBe(89.9)
    expect(resMixed.fixedTransactionCost).toBeCloseTo(49.8, 1) // 20 * 2.49 = 49.8
    expect(resMixed.totalRetido).toBeCloseTo(89.9 + 49.8 + 3.67, 1)
  })

  it('deve consolidar o lucro líquido real abatendo gateway e custos fixos/iniciais amortizados', () => {
    const entries: OrganicDailyEntry[] = [
      {
        id: '1',
        data: '2026-10-01',
        modeloId: 'mod_1',
        canalRedeSocial: 'TikTok',
        horasTrabalhadas: 20,
        faturamento: 5000,
        custoReposicaoContas: 200,
        qtdContasRepostas: 4,
        outrosCustosContingencia: 100, // Contingência total = 300
      },
    ]

    // Gateway: 10% total para facilitar o cálculo mental (R$ 500)
    const gateway = {
      preset: 'custom' as const,
      name: 'Custom',
      feeType: 'percentage' as const,
      percentageFee: 10,
      fixedFeePerTransaction: 0,
      withdrawalOrMonthlyFee: 0,
      enabled: true,
    }

    // Custos:
    // 1 inicial de R$ 900 amortizado em 3 meses => R$ 300 no mês
    // 1 mensal de R$ 200 => R$ 200 no mês
    // Total custos extras = R$ 500
    const costs = [
      {
        id: 'cost_1',
        modeloId: 'mod_1',
        nome: 'Celular iPhone 11',
        categoria: 'equipamento' as const,
        tipo: 'inicial' as const,
        valor: 900,
        amortizarMeses: 3,
        ativo: true,
        criadoEm: '2026-10-01',
      },
      {
        id: 'cost_2',
        modeloId: 'mod_1',
        nome: 'Assinatura Multilogin',
        categoria: 'software' as const,
        tipo: 'mensal' as const,
        valor: 200,
        ativo: true,
        criadoEm: '2026-10-01',
      },
    ]

    const result = consolidateOrganicFinances(entries, gateway, costs)

    expect(result.faturamentoBruto).toBe(5000)
    expect(result.gatewayBreakdown.totalRetido).toBe(500)
    expect(result.totalContingenciaDiaria).toBe(300)
    expect(result.custoInicialAplicado).toBe(300)
    expect(result.custoFixoMensalTotal).toBe(200)
    expect(result.totalCustosExtras).toBe(500)

    // Deduções totais = 500 (gateway) + 300 (contingência) + 500 (extras) = 1300
    // Lucro líquido real = 5000 - 1300 = 3700
    expect(result.lucroLiquidoReal).toBe(3700)
    // Horas = 20 => Valor Hora Real = 3700 / 20 = R$ 185/h
    expect(result.valorHoraReal).toBe(185)
    // Margem real = (3700 / 5000) * 100 = 74%
    expect(result.margemLiquidaReal).toBe(74)
  })
})

