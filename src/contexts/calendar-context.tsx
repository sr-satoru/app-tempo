import React, { createContext, useContext, useState } from 'react'

interface CalendarContextType {
  selectedYear: number
  selectedMonth: number // 0 a 11
  setSelectedYear: (year: number) => void
  setSelectedMonth: (month: number) => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth())

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((prev) => prev - 1)
      setSelectedMonth(11)
    } else {
      setSelectedMonth((prev) => prev - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((prev) => prev + 1)
      setSelectedMonth(0)
    } else {
      setSelectedMonth((prev) => prev + 1)
    }
  }

  const goToCurrentMonth = () => {
    const cur = new Date()
    setSelectedYear(cur.getFullYear())
    setSelectedMonth(cur.getMonth())
  }

  return (
    <CalendarContext.Provider
      value={{
        selectedYear,
        selectedMonth,
        setSelectedYear,
        setSelectedMonth,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendarContext() {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendarContext deve ser usado dentro de um CalendarProvider')
  }
  return context
}
