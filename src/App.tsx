import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { CalendarProvider } from '@/contexts/calendar-context'
import { NotificationProvider } from '@/components/ui/notification'
import { AppLayout } from '@/(app)/layout'
import DashboardPage from '@/(app)/dashboard/page'
import OrganicPage from '@/(app)/organico/page'
import PaidPage from '@/(app)/pago/page'

export function App() {
  return (
    <ThemeProvider>
      <CalendarProvider>
        <NotificationProvider />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/organico" element={<OrganicPage />} />
              <Route path="/pago" element={<PaidPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CalendarProvider>
    </ThemeProvider>
  )
}

export default App
