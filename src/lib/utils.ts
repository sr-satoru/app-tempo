import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function formatPercent(value: number): string {
  return `${(value || 0).toFixed(1)}%`
}

export function formatHours(value: number): string {
  const val = value || 0
  return `${val.toFixed(1)}h`
}
