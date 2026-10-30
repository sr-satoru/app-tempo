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
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [entries, setEntries] = useState<PaidDailyEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadProfiles = async () => {
    const list = await api.models.listPaidProfiles()
    setProfiles(list)
    if (list.length > 0 && !selectedProfileId) {
      setSelectedProfileId(list[0].id)
    }
  }

  const loadEntries = async () => {
    if (!selectedProfileId) return
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
    if (selectedProfileId) {
      loadEntries()
    }
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
    const list = await api.models.deletePaidProfile(id)
    setProfiles(list)
    if (list.length > 0) {
      if (selectedProfileId === id || !list.some((p) => p.id === selectedProfileId)) {
        setSelectedProfileId(list[0].id)
      } else {
        loadEntries()
      }
    } else {
      setSelectedProfileId('')
      setEntries([])
    }
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

      <TablePaid
        days={days}
        entries={entries}
        selectedProfileId={selectedProfileId}
        onSaveEntry={handleSaveEntry}
      />
    </div>
  )
}
