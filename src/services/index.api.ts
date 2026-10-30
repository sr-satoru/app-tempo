import { serviceModels } from './models/service.models'
import { serviceAnalytics } from './analytics/service.analytics'
import { serviceExport } from './export/service.export'

/**
 * Fachada Central (Facade) de Serviços
 * Permite importação unificada em qualquer componente:
 * import { api } from '@/services/index.api'
 */
export const api = {
  models: serviceModels,
  analytics: serviceAnalytics,
  export: serviceExport,
}
