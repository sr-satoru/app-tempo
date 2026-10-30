import React, { useEffect, useState, useMemo } from 'react'
import { ModelSelector } from '@/components/analytics/model-selector'
import { SummaryCards } from '@/components/analytics/summary-cards'
import { TableOrganic } from '@/components/analytics/table-organic'
import { useCalendarContext } from '@/contexts/calendar-context'
import { getDaysInMonth } from '@/domain/calendar'
import { summarizeOrganicPeriod } from '@/domain/calculations'
import { api } from '@/services/index.api'
import type { ModeloEntity } from '@/types/model'
import type { OrganicDailyEntry } from '@/types/analytics'

export default function OrganicPage() {
  const { selectedYear, selectedMonth } = useCalendarContext()
  const [models, setModels] = useState<ModeloEntity[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('all')
  const [entries, setEntries] = useState<OrganicDailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Carrega modelos
  const loadModels = async () => {
    const list = await api.models.listModels()
    setModels(list)
    if (selectedModelId === 'all' && list.length > 0 && false) {
      // mantem 'all'
    }
  }

  // Carrega lançamentos do mês e modelo selecionados
  const loadEntries = async () => {
    setLoading(true)
    try {
      const list = await api.analytics.listOrganicEntries({
        year: selectedYear,
        month: selectedMonth,
        modeloId: selectedModelId,
      })
      setEntries(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, [])

  useEffect(() => {
    loadEntries()
  }, [selectedYear, selectedMonth, selectedModelId])

  // Salvar lançamento
  const handleSaveEntry = async (entry: OrganicDailyEntry) => {
    await api.analytics.upsertOrganicEntry(entry)
    // Atualiza estado local
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.data === entry.data && e.modeloId === entry.modeloId)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = entry
        return copy
      }
      return [...prev, entry]
    })
  }

  // Criação de nova modelo
  const handleCreateModel = async (nome: string, desc?: string) => {
    const created = await api.models.createModel(nome, desc)
    await loadModels()
    setSelectedModelId(created.id)
  }

  // Exclusão de modelo
  const handleDeleteModel = async (id: string) => {
    await api.models.deleteModel(id)
    await loadModels()
  }

  // Dias do mês atual gerados offline
  const days = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  // Resumo consolidado do período (Média Ponderada Real da Hora)
  const summary = useMemo(() => {
    return summarizeOrganicPeriod(entries)
  }, [entries])

  return (
    <div className="space-y-4">
      {/* Seletor Dinâmico de Modelos OFM */}
      <ModelSelector
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
        onCreateModel={handleCreateModel}
        onDeleteModel={handleDeleteModel}
      />

      {/* Cards de Resumo */}
      <SummaryCards summary={summary} mode="organico" />

      {/* Aviso caso selecione 'Todas as Modelos' */}
      {selectedModelId === 'all' && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between">
          <span>
            💡 <strong>Visão Consolidada de Todas as Modelos:</strong> Você está visualizando a soma geral de contingência e faturamento. Para lançar dados diários com precisão, selecione uma modelo específica acima.
          </span>
        </div>
      )}

      {/* Tabela Diária do Mês */}
      <TableOrganic
        days={days}
        entries={entries}
        selectedModelId={selectedModelId}
        onSaveEntry={handleSaveEntry}
      />
    </div>
  )
}
