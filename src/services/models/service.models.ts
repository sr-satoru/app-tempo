import { storage } from '@/services/storage'
import type { ModeloEntity, PaidProfileEntity } from '@/types/model'

export const serviceModels = {
  // Modelos OFM
  listModels: async (): Promise<ModeloEntity[]> => {
    await storage.ensureLoaded()
    return storage.getModels()
  },

  createModel: async (nome: string, descricao?: string): Promise<ModeloEntity> => {
    await storage.ensureLoaded()
    const models = storage.getModels()
    const newModel: ModeloEntity = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nome: nome.trim(),
      ativa: true,
      descricao: descricao?.trim(),
      criadaEm: new Date().toISOString(),
    }
    const updated = [newModel, ...models]
    storage.saveModels(updated)
    return newModel
  },

  toggleModelStatus: async (id: string): Promise<ModeloEntity[]> => {
    await storage.ensureLoaded()
    const models = storage.getModels()
    const updated = models.map((m) => (m.id === id ? { ...m, ativa: !m.ativa } : m))
    storage.saveModels(updated)
    return updated
  },

  deleteModel: async (id: string): Promise<ModeloEntity[]> => {
    await storage.ensureLoaded()
    const models = storage.getModels()
    const updated = models.filter((m) => m.id !== id)
    storage.saveModels(updated)
    return updated
  },

  // Perfis / BMs de Tráfego Pago
  listPaidProfiles: async (): Promise<PaidProfileEntity[]> => {
    await storage.ensureLoaded()
    return storage.getPaidProfiles()
  },

  createPaidProfile: async (nome: string, descricao?: string): Promise<PaidProfileEntity> => {
    await storage.ensureLoaded()
    const profiles = storage.getPaidProfiles()
    const newProfile: PaidProfileEntity = {
      id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nome: nome.trim(),
      ativo: true,
      descricao: descricao?.trim(),
      criadoEm: new Date().toISOString(),
    }
    const updated = [newProfile, ...profiles]
    storage.savePaidProfiles(updated)
    return newProfile
  },

  deletePaidProfile: async (id: string): Promise<PaidProfileEntity[]> => {
    await storage.ensureLoaded()
    const profiles = storage.getPaidProfiles()
    const updated = profiles.filter((p) => p.id !== id)
    storage.savePaidProfiles(updated)
    return updated
  },
}
