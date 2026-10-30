import type { ModeloEntity, PaidProfileEntity } from '@/types/model'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'

const STORAGE_KEYS = {
  MODELS: 'app_models_v1',
  PAID_PROFILES: 'app_paid_profiles_v1',
  ORGANIC_ENTRIES: 'app_organic_entries_v1',
  PAID_ENTRIES: 'app_paid_entries_v1',
}

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
}
