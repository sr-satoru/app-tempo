import type { ModeloEntity, PaidProfileEntity } from '@/types/model'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'
import type { GatewayConfig, FixedCostItem } from '@/types/finance'

const STORAGE_KEYS = {
  MODELS: 'app_models_v1',
  PAID_PROFILES: 'app_paid_profiles_v1',
  ORGANIC_ENTRIES: 'app_organic_entries_v1',
  PAID_ENTRIES: 'app_paid_entries_v1',
  GATEWAY_CONFIG: 'app_gateway_config_v1',
  FIXED_COSTS: 'app_fixed_costs_v1',
}

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  preset: 'kiwify',
  name: 'Kiwify',
  feeType: 'mixed',
  percentageFee: 8.99,
  fixedFeePerTransaction: 2.49,
  averageTicket: 47.0,
  withdrawalOrMonthlyFee: 3.67,
  enabled: true,
}

const DEFAULT_FIXED_COSTS: FixedCostItem[] = [
  {
    id: 'cost_init_1',
    modeloId: 'mod_1',
    nome: 'iPhone 11 p/ Gravação e TikTok',
    categoria: 'equipamento',
    tipo: 'inicial',
    valor: 1200,
    amortizarMeses: 3,
    ativo: true,
    criadoEm: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'cost_init_2',
    modeloId: 'mod_1',
    nome: 'Ensaio Fotográfico Inicial',
    categoria: 'conteudo',
    tipo: 'inicial',
    valor: 450,
    amortizarMeses: 1,
    ativo: true,
    criadoEm: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'cost_fix_1',
    modeloId: 'mod_1',
    nome: 'Assinatura Multilogin (Dolphin)',
    categoria: 'software',
    tipo: 'mensal',
    valor: 99,
    amortizarMeses: 1,
    ativo: true,
    criadoEm: '2026-10-01T00:00:00.000Z',
  },
]

const DEFAULT_MODELS: ModeloEntity[] = [
  { id: 'mod_1', nome: 'Modelo Laura VIP', ativa: true, criadaEm: new Date().toISOString() },
  { id: 'mod_2', nome: 'Modelo Carol Star', ativa: true, criadaEm: new Date().toISOString() },
  { id: 'mod_3', nome: 'Modelo Bruna Dark', ativa: true, criadaEm: new Date().toISOString() },
]

const DEFAULT_PROFILES: PaidProfileEntity[] = [
  { id: 'prof_1', nome: 'BM 01 - Escala Meta', ativo: true, criadoEm: new Date().toISOString() },
  { id: 'prof_2', nome: 'BM 02 - Google Ads', ativo: true, criadoEm: new Date().toISOString() },
]

export const storage = {
  getModels(): ModeloEntity[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MODELS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(DEFAULT_MODELS))
      return DEFAULT_MODELS
    }
    try {
      return JSON.parse(raw)
    } catch {
      return DEFAULT_MODELS
    }
  },

  saveModels(models: ModeloEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models))
  },

  getPaidProfiles(): PaidProfileEntity[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAID_PROFILES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PAID_PROFILES, JSON.stringify(DEFAULT_PROFILES))
      return DEFAULT_PROFILES
    }
    try {
      return JSON.parse(raw)
    } catch {
      return DEFAULT_PROFILES
    }
  },

  savePaidProfiles(profiles: PaidProfileEntity[]): void {
    localStorage.setItem(STORAGE_KEYS.PAID_PROFILES, JSON.stringify(profiles))
  },

  getOrganicEntries(): OrganicDailyEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIC_ENTRIES)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  },

  saveOrganicEntries(entries: OrganicDailyEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.ORGANIC_ENTRIES, JSON.stringify(entries))
  },

  getPaidEntries(): PaidDailyEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAID_ENTRIES)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  },

  savePaidEntries(entries: PaidDailyEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.PAID_ENTRIES, JSON.stringify(entries))
  },

  // --- Gateway & Custos Fixos / Iniciais ---
  getGatewayConfig(modeloId: string): GatewayConfig {
    if (!modeloId) return { ...DEFAULT_GATEWAY_CONFIG }
    const raw = localStorage.getItem(`${STORAGE_KEYS.GATEWAY_CONFIG}_${modeloId}`)
    if (!raw) return { ...DEFAULT_GATEWAY_CONFIG }
    try {
      return { ...DEFAULT_GATEWAY_CONFIG, ...JSON.parse(raw) }
    } catch {
      return { ...DEFAULT_GATEWAY_CONFIG }
    }
  },

  saveGatewayConfig(modeloId: string, config: GatewayConfig): void {
    if (!modeloId) return
    localStorage.setItem(`${STORAGE_KEYS.GATEWAY_CONFIG}_${modeloId}`, JSON.stringify(config))
  },

  getFixedCosts(modeloId: string): FixedCostItem[] {
    if (!modeloId) return []
    const raw = localStorage.getItem(`${STORAGE_KEYS.FIXED_COSTS}_${modeloId}`)
    if (!raw) {
      if (modeloId === 'mod_1') {
        localStorage.setItem(
          `${STORAGE_KEYS.FIXED_COSTS}_${modeloId}`,
          JSON.stringify(DEFAULT_FIXED_COSTS)
        )
        return DEFAULT_FIXED_COSTS
      }
      return []
    }
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  },

  saveFixedCosts(modeloId: string, items: FixedCostItem[]): void {
    if (!modeloId) return
    localStorage.setItem(`${STORAGE_KEYS.FIXED_COSTS}_${modeloId}`, JSON.stringify(items))
  },
}
