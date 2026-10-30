import React, { Component, ErrorInfo, ReactNode, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { HeaderCalendar } from '@/components/analytics/header-calendar'
import { ExportModal } from '@/components/analytics/export-modal'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ContentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ContentErrorBoundary capturou erro:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Ocorreu um erro ao carregar esta área
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
            {this.state.error?.message || 'Erro inesperado na renderização.'}
          </p>
          <Button variant="default" size="sm" onClick={this.handleReset}>
            Tentar Novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export const AppLayout: React.FC = () => {
  const [isExportOpen, setIsExportOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header com Calendário e Exportação */}
      <HeaderCalendar onOpenExport={() => setIsExportOpen(true)} />

      {/* Navegação Minimalista de Abas */}
      <div className="border-b border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#0E0F12] px-6">
        <div className="max-w-[1600px] mx-auto flex items-center gap-6">
          <NavLink
            to="/organico"
            className={({ isActive }) =>
              `py-3 text-xs font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-[#7C3AED] text-[#7C3AED] dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`
            }
          >
            Tráfego Orgânico (OFM)
          </NavLink>

          <NavLink
            to="/pago"
            className={({ isActive }) =>
              `py-3 text-xs font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-[#7C3AED] text-[#7C3AED] dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`
            }
          >
            Tráfego Pago (Ads & BMs)
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `py-3 text-xs font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-[#7C3AED] text-[#7C3AED] dark:text-white font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`
            }
          >
            Visão Geral / Ranking
          </NavLink>
        </div>
      </div>

      {/* Conteúdo Principal com Widescreen Confortável */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        <ContentErrorBoundary>
          <Outlet />
        </ContentErrorBoundary>
      </main>

      {/* Modal de Exportação */}
      <ExportModal open={isExportOpen} onOpenChange={setIsExportOpen} />
    </div>
  )
}
