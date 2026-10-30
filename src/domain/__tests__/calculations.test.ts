import { describe, it, expect } from 'vitest'
import {
  calculateOrganicDaily,
  calculatePaidDaily,
  summarizeOrganicPeriod,
  summarizePaidPeriod,
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
})
