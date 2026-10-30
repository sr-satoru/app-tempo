export type SocialChannel = 'TikTok' | 'Instagram' | 'Reddit' | 'X (Twitter)' | 'Tinder/Bumble' | 'Outro'

export interface OrganicDailyEntry {
  id: string
  data: string // "YYYY-MM-DD"
  modeloId: string
  canalRedeSocial: SocialChannel | string
  horasTrabalhadas: number
  faturamento: number
  custoReposicaoContas: number
  qtdContasRepostas: number
  outrosCustosContingencia: number // proxies, chips, multilogin
  observacoes?: string
}

export interface PaidDailyEntry {
  id: string
  data: string // "YYYY-MM-DD"
  profileId: string
  horasTrabalhadas: number
  faturamento: number
  gastoAds: number
  outrosGastos: number
  observacoes?: string
}

export interface CalculatedOrganicDaily {
  entry: OrganicDailyEntry
  totalContingencia: number
  lucroLiquido: number
  valorHoraHoje: number
  custoMedioPorConta: number
  margemLucroPercent: number
}

export interface CalculatedPaidDaily {
  entry: PaidDailyEntry
  totalGastos: number
  lucroLiquido: number
  valorHoraHoje: number
  roas: number
  roiPercent: number
  margemLucroPercent: number
}

export interface PeriodSummary {
  totalFaturamento: number
  totalGastos: number
  totalLucro: number
  totalHoras: number
  mediaRealHora: number
  mediaRoas?: number
  roiGeralPercent?: number
  totalContasRepostas?: number
  custoMedioContaGeral?: number
}
