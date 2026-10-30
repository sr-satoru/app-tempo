import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/notification'
import type { PaidProfileEntity } from '@/types/model'

interface ProfileSelectorProps {
  profiles: PaidProfileEntity[]
  selectedProfileId: string
  onSelectProfile: (id: string) => void
  onCreateProfile: (nome: string, descricao?: string) => Promise<void>
  onDeleteProfile: (id: string) => Promise<void>
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileDesc, setNewProfileDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfileName.trim()) {
      toast.error('Digite o nome do Perfil/BM!')
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateProfile(newProfileName, newProfileDesc)
      toast.success(`Perfil "${newProfileName}" criado.`)
      setNewProfileName('')
      setNewProfileDesc('')
      setIsModalOpen(false)
    } catch {
      toast.error('Erro ao cadastrar perfil.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCurrent = async () => {
    const current = profiles.find((p) => p.id === selectedProfileId)
    if (!current) return
    if (confirm(`Deseja realmente remover o perfil "${current.nome}"?`)) {
      await onDeleteProfile(current.id)
      toast.success(`Perfil "${current.nome}" removido.`)
      onSelectProfile('all')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <label htmlFor="profile-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Perfil / BM:
        </label>

        <select
          id="profile-select"
          value={selectedProfileId}
          onChange={(e) => onSelectProfile(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer min-w-[220px] sm:min-w-[260px] focus:outline-none focus:border-[#7C3AED]"
        >
          <option value="all">Todos os Perfis (Geral · {profiles.length})</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id} className="bg-white dark:bg-[#121316]">
              {p.nome}
            </option>
          ))}
        </select>

        {selectedProfileId !== 'all' && profiles.length > 1 && (
          <button
            type="button"
            onClick={handleDeleteCurrent}
            className="text-xs text-rose-500 hover:text-rose-600 hover:underline px-2 transition-colors"
          >
            Excluir perfil selecionado
          </button>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="h-9 text-xs border-slate-200 dark:border-[#1E2025] hover:bg-slate-100 dark:hover:bg-[#18191E]"
      >
        + Novo Perfil / BM
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Cadastrar Perfil / BM de Tráfego Pago</DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Nome do Perfil / BM
                </label>
                <Input
                  placeholder="Ex: BM 01 - Modelo Laura"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Observações (Opcional)
                </label>
                <Input
                  placeholder="Conta de anúncio, ID ou limites"
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
