import React, { useState, useRef, useEffect } from 'react'
import { Trash2, ChevronDown, Check } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileDesc, setNewProfileDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentProfile = profiles.find((p) => p.id === selectedProfileId)

  // Apaga de verdade o perfil e todos os lançamentos de tráfego pago associados
  const handleDelete = async (id: string, nome: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    if (!confirm(`Deseja realmente apagar o perfil "${nome}" e todos os seus lançamentos de tráfego pago?`)) {
      return
    }

    try {
      await onDeleteProfile(id)
      toast.success(`Perfil "${nome}" apagado com sucesso.`)
      setIsOpen(false)
    } catch {
      toast.error('Erro ao excluir perfil.')
    }
  }

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

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
          Perfil / BM:
        </label>

        {/* Caixa de Seleção com Lixeira DENTRO */}
        <div className="relative" ref={containerRef}>
          <div
            id="profile-select"
            role="button"
            tabIndex={0}
            onClick={() => setIsOpen(!isOpen)}
            className="h-9 px-3 pr-2 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer min-w-[220px] sm:min-w-[270px] flex items-center justify-between gap-2 shadow-xs transition-colors hover:border-[#7C3AED]/50 focus:outline-none focus:border-[#7C3AED]"
          >
            {/* Nome do Perfil Selecionado */}
            <span className="truncate flex-1 text-left">
              {profiles.length === 0
                ? 'Nenhum perfil cadastrado'
                : selectedProfileId === 'all'
                ? `Todos os Perfis (Geral · ${profiles.length})`
                : currentProfile?.nome || 'Selecione um perfil'}
            </span>

            {/* Ícones DENTRO do Select: Botão de Lixeira + Chevron */}
            <div className="flex items-center gap-1 shrink-0">
              {currentProfile && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(currentProfile.id, currentProfile.nome, e)}
                  title={`Apagar perfil "${currentProfile.nome}"`}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  aria-label="Apagar perfil selecionado"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </button>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Dropdown de Opções */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-full min-w-[270px] rounded-lg border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] shadow-xl z-50 py-1 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
              {/* Opção "Todos os Perfis" */}
              {profiles.length > 0 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectProfile('all')
                    setIsOpen(false)
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                    selectedProfileId === 'all'
                      ? 'bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA] font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#181920]'
                  }`}
                >
                  <span>Todos os Perfis (Geral · {profiles.length})</span>
                  {selectedProfileId === 'all' && <Check className="w-3.5 h-3.5 text-[#7C3AED]" />}
                </div>
              )}

              {/* Lista com cada Perfil e botão de lixeira individual */}
              {profiles.map((p) => {
                const isSelected = p.id === selectedProfileId
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelectProfile(p.id)
                      setIsOpen(false)
                    }}
                    className={`group flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA] font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#181920]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#7C3AED]" />}
                      <span className="truncate">{p.nome}</span>
                    </div>

                    {/* Botão de Lixeira DENTRO da lista de opções */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(p.id, p.nome, e)}
                      title={`Apagar perfil "${p.nome}"`}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-70 group-hover:opacity-100 transition-all ml-2"
                      aria-label={`Apagar perfil ${p.nome}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                )
              })}

              {profiles.length === 0 && (
                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                  Nenhum perfil cadastrado
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Adicionar Novo Perfil */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="h-9 text-xs border-slate-200 dark:border-[#1E2025] hover:bg-slate-100 dark:hover:bg-[#18191E]"
      >
        + Novo Perfil / BM
      </Button>

      {/* Modal de Cadastro */}
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
                  placeholder="Nome do perfil"
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
