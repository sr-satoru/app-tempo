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
import type { ModeloEntity } from '@/types/model'

interface ModelSelectorProps {
  models: ModeloEntity[]
  selectedModelId: string
  onSelectModel: (id: string) => void
  onCreateModel: (nome: string, descricao?: string) => Promise<void>
  onDeleteModel: (id: string) => Promise<void>
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onCreateModel,
  onDeleteModel,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [newModelDesc, setNewModelDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentModel = models.find((m) => m.id === selectedModelId)

  // Apaga de verdade a modelo e todos os dados associados
  const handleDelete = async (id: string, nome: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    if (!confirm(`Deseja realmente apagar a modelo "${nome}" e todos os seus lançamentos e custos?`)) {
      return
    }

    try {
      await onDeleteModel(id)
      toast.success(`Modelo "${nome}" apagada com sucesso.`)
      setIsOpen(false)
    } catch {
      toast.error('Erro ao excluir modelo.')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModelName.trim()) {
      toast.error('Digite o nome da modelo!')
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateModel(newModelName, newModelDesc)
      toast.success(`Modelo "${newModelName}" cadastrada.`)
      setNewModelName('')
      setNewModelDesc('')
      setIsModalOpen(false)
    } catch {
      toast.error('Erro ao cadastrar modelo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
          Modelo OFM:
        </label>

        {/* Caixa de Seleção com Lixeira DENTRO */}
        <div className="relative" ref={containerRef}>
          <div
            id="model-select"
            role="button"
            tabIndex={0}
            onClick={() => setIsOpen(!isOpen)}
            className="h-9 px-3 pr-2 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer min-w-[220px] sm:min-w-[270px] flex items-center justify-between gap-2 shadow-xs transition-colors hover:border-[#7C3AED]/50 focus:outline-none focus:border-[#7C3AED]"
          >
            {/* Nome da Modelo Selecionada */}
            <span className="truncate flex-1 text-left">
              {models.length === 0
                ? 'Nenhuma modelo cadastrada'
                : selectedModelId === 'all'
                ? `Todas as Modelos (Geral · ${models.length})`
                : currentModel?.nome || 'Selecione uma modelo'}
            </span>

            {/* Ícones DENTRO do Select: Botão de Lixeira + Chevron */}
            <div className="flex items-center gap-1 shrink-0">
              {currentModel && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(currentModel.id, currentModel.nome, e)}
                  title={`Apagar modelo "${currentModel.nome}"`}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  aria-label="Apagar modelo selecionada"
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
              {/* Opção "Todas as Modelos" */}
              {models.length > 0 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectModel('all')
                    setIsOpen(false)
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                    selectedModelId === 'all'
                      ? 'bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA] font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#181920]'
                  }`}
                >
                  <span>Todas as Modelos (Geral · {models.length})</span>
                  {selectedModelId === 'all' && <Check className="w-3.5 h-3.5 text-[#7C3AED]" />}
                </div>
              )}

              {/* Lista com cada Modelo e botão de lixeira individual */}
              {models.map((m) => {
                const isSelected = m.id === selectedModelId
                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelectModel(m.id)
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
                      <span className="truncate">{m.nome}</span>
                    </div>

                    {/* Botão de Lixeira DENTRO da lista de opções */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(m.id, m.nome, e)}
                      title={`Apagar modelo "${m.nome}"`}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-70 group-hover:opacity-100 transition-all ml-2"
                      aria-label={`Apagar modelo ${m.nome}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                )
              })}

              {models.length === 0 && (
                <div className="px-3 py-3 text-xs text-slate-400 text-center">
                  Nenhuma modelo cadastrada
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Adicionar Nova Modelo */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="h-9 text-xs border-slate-200 dark:border-[#1E2025] hover:bg-slate-100 dark:hover:bg-[#18191E]"
      >
        + Nova Modelo
      </Button>

      {/* Modal de Cadastro */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Modelo OFM</DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Nome da Modelo / Slug
                </label>
                <Input
                  placeholder="Nome da modelo"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">
                  Observações (Opcional)
                </label>
                <Input
                  placeholder="Detalhes ou metas"
                  value={newModelDesc}
                  onChange={(e) => setNewModelDesc(e.target.value)}
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
