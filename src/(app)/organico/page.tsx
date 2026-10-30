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
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [entries, setEntries] = useState<OrganicDailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Carrega modelos e seleciona a primeira modelo por padrão para nunca bloquear nenhum dia
  const loadModels = async () => {
    const list = await api.models.listModels()
    setModels(list)
    if (list.length > 0 && !selectedModelId) {
      setSelectedModelId(list[0].id)
    }
  }

  // Carrega lançamentos do mês e modelo selecionados
  const loadEntries = async () => {
    if (!selectedModelId) return
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
    if (selectedModelId) {
      loadEntries()
    }
  }, [selectedYear, selectedMonth, selectedModelId])

  // Salvar lançamento - qualquer dia passado ou futuro pode ser editado a qualquer momento
  const handleSaveEntry = async (entry: OrganicDailyEntry) => {
    await api.analytics.upsertOrganicEntry(entry)
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

  const handleCreateModel = async (nome: string, desc?: string) => {
    const created = await api.models.createModel(nome, desc)
    await loadModels()
    setSelectedModelId(created.id)
  }

  const handleDeleteModel = async (id: string) => {
    await api.models.deleteModel(id)
    const list = await api.models.listModels()
    setModels(list)
    if (list.length > 0) {
      setSelectedModelId(list[0].id)
    } else {
      setSelectedModelId('')
    }
  }

  const days = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const summary = useMemo(() => {
    return summarizeOrganicPeriod(entries)
  }, [entries])

  return (
    <div className="space-y-4">
      {/* Seletor de Modelo */}
      <ModelSelector
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
        onCreateModel={handleCreateModel}
        onDeleteModel={handleDeleteModel}
      />

      {/* Cards de Resumo */}
      <SummaryCards summary={summary} mode="organico" />

      {/* Tabela Diária do Mês - Todos os dias anteriores e atuais 100% editáveis */}
      <TableOrganic
        days={days}
        entries={entries}
        selectedModelId={selectedModelId}
        onSaveEntry={handleSaveEntry}
      />
    </div>
  )
}
