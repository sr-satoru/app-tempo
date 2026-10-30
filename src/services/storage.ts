import type { ModeloEntity, PaidProfileEntity } from '@/types/model'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'
import type { GatewayConfig, FixedCostItem } from '@/types/finance'

export interface BancoData {
  models: ModeloEntity[]
  paidProfiles: PaidProfileEntity[]
  organicEntries: OrganicDailyEntry[]
  paidEntries: PaidDailyEntry[]
  gatewayConfigs: Record<string, GatewayConfig>
  fixedCosts: Record<string, FixedCostItem[]>
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
    nome: 'iPhone 11 (Aparelho e Contas)',
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
    nome: 'Assinatura Multilogin Dolphin',
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

let memoryDb: BancoData = {
  models: DEFAULT_MODELS,
  paidProfiles: DEFAULT_PROFILES,
  organicEntries: [],
  paidEntries: [],
  gatewayConfigs: {
    mod_1: { ...DEFAULT_GATEWAY_CONFIG },
  },
  fixedCosts: {
    mod_1: [...DEFAULT_FIXED_COSTS],
  },
}

let loadPromise: Promise<BancoData> | null = null

export async function ensureLoaded(): Promise<BancoData> {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      const res = await fetch(`/api/banco?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data === 'object') {
          memoryDb = {
            models: Array.isArray(data.models) ? data.models : DEFAULT_MODELS,
            paidProfiles: Array.isArray(data.paidProfiles) ? data.paidProfiles : DEFAULT_PROFILES,
            organicEntries: Array.isArray(data.organicEntries) ? data.organicEntries : [],
            paidEntries: Array.isArray(data.paidEntries) ? data.paidEntries : [],
            gatewayConfigs: data.gatewayConfigs || { mod_1: { ...DEFAULT_GATEWAY_CONFIG } },
            fixedCosts: data.fixedCosts || { mod_1: [...DEFAULT_FIXED_COSTS] },
          }
          return memoryDb
        }
      }
    } catch (err) {
      console.warn('[storage] Falha ao carregar de /api/banco, mantendo dados em memória:', err)
    }
    return memoryDb
  })()

  return loadPromise
}

// Dispara leitura imediatamente ao carregar o bundle
if (typeof window !== 'undefined') {
  ensureLoaded()
}

async function persist(): Promise<void> {
  try {
    await fetch('/api/banco', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memoryDb),
    })
  } catch (err) {
    console.error('[storage] Erro ao gravar em data/banco.json:', err)
  }
}

export const storage = {
  ensureLoaded,

  getModels(): ModeloEntity[] {
    return memoryDb.models
  },

  saveModels(models: ModeloEntity[]): void {
    memoryDb.models = models
    persist()
  },

  getPaidProfiles(): PaidProfileEntity[] {
    return memoryDb.paidProfiles
  },

  savePaidProfiles(profiles: PaidProfileEntity[]): void {
    memoryDb.paidProfiles = profiles
    persist()
  },

  getOrganicEntries(): OrganicDailyEntry[] {
    return memoryDb.organicEntries
  },

  saveOrganicEntries(entries: OrganicDailyEntry[]): void {
    memoryDb.organicEntries = entries
    persist()
  },

  getPaidEntries(): PaidDailyEntry[] {
    return memoryDb.paidEntries
  },

  savePaidEntries(entries: PaidDailyEntry[]): void {
    memoryDb.paidEntries = entries
    persist()
  },

  // --- Gateway & Custos Fixos / Iniciais ---
  getGatewayConfig(modeloId: string): GatewayConfig {
    if (!modeloId) return { ...DEFAULT_GATEWAY_CONFIG }
    return memoryDb.gatewayConfigs[modeloId] || { ...DEFAULT_GATEWAY_CONFIG }
  },

  saveGatewayConfig(modeloId: string, config: GatewayConfig): void {
    if (!modeloId) return
    memoryDb.gatewayConfigs[modeloId] = config
    persist()
  },

  getFixedCosts(modeloId: string): FixedCostItem[] {
    if (!modeloId) return []
    return memoryDb.fixedCosts[modeloId] || (modeloId === 'mod_1' ? DEFAULT_FIXED_COSTS : [])
  },

  saveFixedCosts(modeloId: string, items: FixedCostItem[]): void {
    if (!modeloId) return
    memoryDb.fixedCosts[modeloId] = items
    persist()
  },
}
