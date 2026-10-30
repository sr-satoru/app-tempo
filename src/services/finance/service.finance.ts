import { storage } from '@/services/storage'
import type { GatewayConfig, FixedCostItem } from '@/types/finance'

export const serviceFinance = {
  getGatewayConfig: async (modeloId: string): Promise<GatewayConfig> => {
    return storage.getGatewayConfig(modeloId)
  },

  saveGatewayConfig: async (modeloId: string, config: GatewayConfig): Promise<void> => {
    storage.saveGatewayConfig(modeloId, config)
  },

  getFixedCosts: async (modeloId: string): Promise<FixedCostItem[]> => {
    return storage.getFixedCosts(modeloId)
  },

  saveFixedCosts: async (modeloId: string, items: FixedCostItem[]): Promise<void> => {
    storage.saveFixedCosts(modeloId, items)
  },
}
