import React, { useEffect, useState, useMemo } from 'react'
import { ProfileSelector } from '@/components/analytics/profile-selector'
import { SummaryCards } from '@/components/analytics/summary-cards'
import { TablePaid } from '@/components/analytics/table-paid'
import { useCalendarContext } from '@/contexts/calendar-context'
import { getDaysInMonth } from '@/domain/calendar'
import { summarizePaidPeriod } from '@/domain/calculations'
import { api } from '@/services/index.api'
import type { PaidProfileEntity } from '@/types/model'
import type { PaidDailyEntry } from '@/types/analytics'

export default function PaidPage() {
  const { selectedYear, selectedMonth } = useCalendarContext()
  const [profiles, setProfiles] = useState<PaidProfileEntity[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all')
  const [entries, setEntries] = useState<PaidDailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadProfiles = async () => {
    const list = await api.models.listPaidProfiles()
    setProfiles(list)
  }

  const loadEntries = async () => {
    setLoading(true)
    try {
      const list = await api.analytics.listPaidEntries({
        year: selectedYear,
        month: selectedMonth,
        profileId: selectedProfileId,
      })
      setEntries(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  useEffect(() => {
    loadEntries()
  }, [selectedYear, selectedMonth, selectedProfileId])

  const handleSaveEntry = async (entry: PaidDailyEntry) => {
    await api.analytics.upsertPaidEntry(entry)
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.data === entry.data && e.profileId === entry.profileId)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = entry
        return copy
      }
      return [...prev, entry]
    })
  }

  const handleCreateProfile = async (nome: string, desc?: string) => {
    const created = await api.models.createPaidProfile(nome, desc)
    await loadProfiles()
    setSelectedProfileId(created.id)
  }

  const handleDeleteProfile = async (id: string) => {
    await api.models.deletePaidProfile(id)
    await loadProfiles()
  }

  const days = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const summary = useMemo(() => {
    return summarizePaidPeriod(entries)
  }, [entries])

  return (
    <div className="space-y-4">
      <ProfileSelector
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={setSelectedProfileId}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
      />

      <SummaryCards summary={summary} mode="pago" />

      {selectedProfileId === 'all' && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
          💡 <strong>Visão Consolidada de Todos os Perfis:</strong> Exibindo o faturamento somado de todas as contas de anúncio e BMs. Para lançar dados diários, selecione uma BM/Perfil acima.
        </div>
      )}

      <TablePaid
        days={days}
        entries={entries}
        selectedProfileId={selectedProfileId}
        onSaveEntry={handleSaveEntry}
      />
    </div>
  )
}
