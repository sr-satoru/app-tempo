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
  withdrawalOrMonthlyFee: 3.67,
  enabled: true,
}

// O estado inicial em memória começa vazio e é alimentado 100% pelo arquivo data/banco.json
let memoryDb: BancoData = {
  models: [],
  paidProfiles: [],
  organicEntries: [],
  paidEntries: [],
  gatewayConfigs: {},
  fixedCosts: {},
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
            models: Array.isArray(data.models) ? data.models : [],
            paidProfiles: Array.isArray(data.paidProfiles) ? data.paidProfiles : [],
            organicEntries: Array.isArray(data.organicEntries) ? data.organicEntries : [],
            paidEntries: Array.isArray(data.paidEntries) ? data.paidEntries : [],
            gatewayConfigs: data.gatewayConfigs || {},
            fixedCosts: data.fixedCosts || {},
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

  window.addEventListener('beforeunload', () => {
    if (persistTimer) {
      clearTimeout(persistTimer)
      try {
        const blob = new Blob([JSON.stringify(memoryDb)], { type: 'application/json' })
        navigator.sendBeacon('/api/banco', blob)
      } catch {
        // fallback
      }
    }
  })
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

function persist(): void {
  if (persistTimer) {
    clearTimeout(persistTimer)
  }

  persistTimer = setTimeout(async () => {
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
  }, 350)
}

async function persistNow(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
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
  persistNow,

  getModels(): ModeloEntity[] {
    return memoryDb.models
  },

  saveModels(models: ModeloEntity[]): void {
    memoryDb.models = models
    persist()
  },

  async deleteModel(id: string): Promise<ModeloEntity[]> {
    memoryDb.models = memoryDb.models.filter((m) => m.id !== id)
    // Apaga de verdade todas as entradas orgânicas, custos e configurações da modelo
    memoryDb.organicEntries = memoryDb.organicEntries.filter((e) => e.modeloId !== id)
    delete memoryDb.gatewayConfigs[id]
    delete memoryDb.fixedCosts[id]
    await persistNow()
    return memoryDb.models
  },

  getPaidProfiles(): PaidProfileEntity[] {
    return memoryDb.paidProfiles
  },

  savePaidProfiles(profiles: PaidProfileEntity[]): void {
    memoryDb.paidProfiles = profiles
    persist()
  },

  async deletePaidProfile(id: string): Promise<PaidProfileEntity[]> {
    memoryDb.paidProfiles = memoryDb.paidProfiles.filter((p) => p.id !== id)
    // Apaga de verdade todas as entradas de tráfego pago do perfil
    memoryDb.paidEntries = memoryDb.paidEntries.filter((e) => e.profileId !== id)
    await persistNow()
    return memoryDb.paidProfiles
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
    return memoryDb.fixedCosts[modeloId] || []
  },

  saveFixedCosts(modeloId: string, items: FixedCostItem[]): void {
    if (!modeloId) return
    memoryDb.fixedCosts[modeloId] = items
    persist()
  },
}
