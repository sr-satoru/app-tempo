import React, { useEffect, useState, useMemo } from 'react'
import { ModelSelector } from '@/components/analytics/model-selector'
import { TableOrganic } from '@/components/analytics/table-organic'
import { OrganicFinancialOverview } from '@/components/analytics/organic-financial-overview'
import { useCalendarContext } from '@/contexts/calendar-context'
import { getDaysInMonth } from '@/domain/calendar'
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

  const currentModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId)
  }, [models, selectedModelId])

  return (
    <div className="space-y-4">
      {/* 1. Seletor de Modelo */}
      <ModelSelector
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
        onCreateModel={handleCreateModel}
        onDeleteModel={handleDeleteModel}
      />

      {/* 2. Tabela Diária do Mês - PRIMEIRA COISA A SER VISTA (Foco total no preenchimento) */}
      <TableOrganic
        days={days}
        entries={entries}
        selectedModelId={selectedModelId}
        onSaveEntry={handleSaveEntry}
      />

      {/* 3. Painel Financeiro Completo Abaixo da Tabela: Taxas de Gateway, Custos Iniciais & Lucro Líquido Real */}
      <OrganicFinancialOverview
        entries={entries}
        selectedModelId={selectedModelId}
        modelName={currentModel?.nome || 'Modelo'}
      />
    </div>
  )
}
