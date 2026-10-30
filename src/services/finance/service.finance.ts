import { storage } from '@/services/storage'
import type { GatewayConfig, FixedCostItem } from '@/types/finance'

export const serviceFinance = {
  getGatewayConfig: async (modeloId: string): Promise<GatewayConfig> => {
    await storage.ensureLoaded()
    return storage.getGatewayConfig(modeloId)
  },

  saveGatewayConfig: async (modeloId: string, config: GatewayConfig): Promise<void> => {
    await storage.ensureLoaded()
    storage.saveGatewayConfig(modeloId, config)
  },

  getFixedCosts: async (modeloId: string): Promise<FixedCostItem[]> => {
    await storage.ensureLoaded()
    return storage.getFixedCosts(modeloId)
  },

  saveFixedCosts: async (modeloId: string, items: FixedCostItem[]): Promise<void> => {
    await storage.ensureLoaded()
    storage.saveFixedCosts(modeloId, items)
  },
}
