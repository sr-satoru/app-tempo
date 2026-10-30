import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [newModelDesc, setNewModelDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleDeleteCurrent = async () => {
    const current = models.find((m) => m.id === selectedModelId)
    if (!current) return
    if (confirm(`Deseja realmente excluir a modelo "${current.nome}"?`)) {
      await onDeleteModel(current.id)
      toast.success(`Modelo "${current.nome}" removida.`)
      onSelectModel('all')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      {/* Seleção via <select> nativo com botão de lixeira acoplado */}
      <div className="flex items-center gap-3">
        <label htmlFor="model-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
          Modelo OFM:
        </label>

        <div className="flex items-center gap-1.5">
          <select
            id="model-select"
            value={selectedModelId}
            onChange={(e) => onSelectModel(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer min-w-[200px] sm:min-w-[250px] focus:outline-none focus:border-[#7C3AED] transition-colors"
          >
            <option value="all">Todas as Modelos (Geral · {models.length})</option>
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-white dark:bg-[#121316]">
                {m.nome}
              </option>
            ))}
          </select>

          {selectedModelId && selectedModelId !== 'all' && (
            <button
              type="button"
              onClick={handleDeleteCurrent}
              title={`Excluir modelo "${models.find((m) => m.id === selectedModelId)?.nome || ''}"`}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/60 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shadow-xs"
              aria-label="Excluir modelo selecionada"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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

      {/* Modal Simples de Cadastro */}
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
                  placeholder="Ex: Laura VIP, Carol TikTok"
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
