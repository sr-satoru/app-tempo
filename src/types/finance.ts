export type GatewayPreset =
  | 'kiwify'
  | 'kirvano'
  | 'hotmart'
  | 'perfectpay'
  | 'stripe'
  | 'mercadopago'
  | 'custom'

export type GatewayFeeType = 'percentage' | 'fixed' | 'mixed'

export interface GatewayConfig {
  preset: GatewayPreset
  name: string
  feeType: GatewayFeeType
  percentageFee: number // Ex: 8.99 (%)
  fixedFeePerTransaction: number // Ex: 2.49 (R$)
  averageTicket: number // Ex: 47.00 (R$)
  estimatedTransactions?: number // Quantidade direta de vendas/transações se informada
  withdrawalOrMonthlyFee: number // Ex: 3.67 (R$) por saque ou taxa de plataforma
  enabled: boolean
}

export type CostCategory =
  | 'equipamento'
  | 'conteudo'
  | 'contingencia'
  | 'software'
  | 'outros'

export type CostType = 'inicial' | 'mensal'

export interface FixedCostItem {
  id: string
  modeloId: string
  nome: string
  categoria: CostCategory
  tipo: CostType
  valor: number
  ativo: boolean
  amortizarMeses?: number // 1 = abater 100% no mês, > 1 = parcelar em X meses
  criadoEm: string
}

export interface GatewayBreakdown {
  enabled: boolean
  percentCost: number
  fixedTransactionCost: number
  fixedWithdrawalCost: number
  totalRetido: number
  effectivePercentage: number
  estimatedTransactionsCount: number
}

export interface FinancialConsolidation {
  faturamentoBruto: number
  totalHoras: number
  totalContingenciaDiaria: number
  totalContasRepostas: number
  custoMedioContaDiaria: number
  gatewayBreakdown: GatewayBreakdown
  custoInicialAplicado: number
  custoInicialTotal: number
  custoFixoMensalTotal: number
  totalCustosExtras: number
  lucroLiquidoReal: number
  valorHoraReal: number
  margemLiquidaReal: number
  roiRealPercent: number
}
