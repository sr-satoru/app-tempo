import { storage } from '@/services/storage'
import type { OrganicDailyEntry, PaidDailyEntry } from '@/types/analytics'

export const serviceAnalytics = {
  // --- Orgânico ---
  listOrganicEntries: async (filters?: {
    modeloId?: string
    year?: number
    month?: number
  }): Promise<OrganicDailyEntry[]> => {
    await storage.ensureLoaded()
    let entries = storage.getOrganicEntries()

    if (filters?.modeloId && filters.modeloId !== 'all') {
      entries = entries.filter((e) => e.modeloId === filters.modeloId)
    }

    if (filters?.year && filters?.month !== undefined) {
      const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`
      entries = entries.filter((e) => e.data.startsWith(monthPrefix))
    }

    return entries
  },

  upsertOrganicEntry: async (entry: OrganicDailyEntry): Promise<OrganicDailyEntry> => {
    await storage.ensureLoaded()
    const entries = storage.getOrganicEntries()
    const index = entries.findIndex(
      (e) => e.data === entry.data && e.modeloId === entry.modeloId
    )

    let updated: OrganicDailyEntry[]
    if (index >= 0) {
      updated = [...entries]
      updated[index] = entry
    } else {
      updated = [...entries, entry]
    }

    storage.saveOrganicEntries(updated)
    return entry
  },

  // --- Tráfego Pago ---
  listPaidEntries: async (filters?: {
    profileId?: string
    year?: number
    month?: number
  }): Promise<PaidDailyEntry[]> => {
    await storage.ensureLoaded()
    let entries = storage.getPaidEntries()

    if (filters?.profileId && filters.profileId !== 'all') {
      entries = entries.filter((e) => e.profileId === filters.profileId)
    }

    if (filters?.year && filters?.month !== undefined) {
      const monthPrefix = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}`
      entries = entries.filter((e) => e.data.startsWith(monthPrefix))
    }

    return entries
  },

  upsertPaidEntry: async (entry: PaidDailyEntry): Promise<PaidDailyEntry> => {
    await storage.ensureLoaded()
    const entries = storage.getPaidEntries()
    const index = entries.findIndex(
      (e) => e.data === entry.data && e.profileId === entry.profileId
    )

    let updated: PaidDailyEntry[]
    if (index >= 0) {
      updated = [...entries]
      updated[index] = entry
    } else {
      updated = [...entries, entry]
    }

    storage.savePaidEntries(updated)
    return entry
  },
}
