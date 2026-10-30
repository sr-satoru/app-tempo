import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { FixedCostItem, CostCategory, CostType } from '@/types/finance'
import { Plus, Trash2, ArrowDownRight } from 'lucide-react'

interface FixedCostsManagerProps {
  modeloId: string
  items: FixedCostItem[]
  custoInicialAplicado: number
  custoInicialTotal: number
  custoFixoMensalTotal: number
  onAddItem: (item: Omit<FixedCostItem, 'id' | 'criadoEm'>) => void
  onToggleItem: (id: string) => void
  onDeleteItem: (id: string) => void
}

const CATEGORY_LABELS: Record<CostCategory, string> = {
  equipamento: 'Equipamento',
  conteudo: 'Conteúdo',
  contingencia: 'Contingência',
  software: 'Software',
  outros: 'Outros',
}

export const FixedCostsManager: React.FC<FixedCostsManagerProps> = ({
  modeloId,
  items,
  custoInicialAplicado,
  custoInicialTotal,
  custoFixoMensalTotal,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}) => {
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<CostCategory>('equipamento')
  const [tipo, setTipo] = useState<CostType>('inicial')
  const [valor, setValor] = useState('')
  const [amortizarMeses, setAmortizarMeses] = useState('1')
  const [isAddingOpen, setIsAddingOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numValor = parseFloat(valor)
    if (!nome.trim() || isNaN(numValor) || numValor <= 0) return

    onAddItem({
      modeloId,
      nome: nome.trim(),
      categoria,
      tipo,
      valor: numValor,
      amortizarMeses: tipo === 'inicial' ? Math.max(1, parseInt(amortizarMeses) || 1) : 1,
      ativo: true,
    })

    setNome('')
    setValor('')
    setIsAddingOpen(false)
  }

  return (
    <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316]">
      <CardContent className="p-4 space-y-3">
        {/* Cabeçalho Minimalista */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1E2025]">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Custos Iniciais & Custos Fixos
            </h3>
            <p className="text-[11px] text-slate-400">
              Gastos de setup da modelo e mensalidades fixas
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsAddingOpen(!isAddingOpen)}
            className="h-7 px-2.5 text-xs border-slate-200 dark:border-[#2A2C3A] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A1C24]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {isAddingOpen ? 'Fechar' : 'Adicionar Custo'}
          </Button>
        </div>

        {/* Formulário Inline Minimalista */}
        {isAddingOpen && (
          <form
            onSubmit={handleSubmit}
            className="p-3 rounded-lg bg-slate-50 dark:bg-[#16171F] border border-slate-200 dark:border-[#1E2025] space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: iPhone 11, Fotos, Dolphin..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full h-7 rounded px-2 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs text-slate-900 dark:text-slate-100 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CostCategory)}
                  className="w-full h-7 rounded px-1.5 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="equipamento">Equipamento</option>
                  <option value="conteudo">Conteúdo</option>
                  <option value="contingencia">Contingência</option>
                  <option value="software">Software</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as CostType)}
                  className="w-full h-7 rounded px-1.5 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="inicial">Inicial (Setup)</option>
                  <option value="mensal">Fixo Mensal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full h-7 rounded px-2 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              {tipo === 'inicial' && (
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Amortização
                  </label>
                  <select
                    value={amortizarMeses}
                    onChange={(e) => setAmortizarMeses(e.target.value)}
                    className="w-full h-7 rounded px-1.5 bg-white dark:bg-[#101115] border border-slate-200 dark:border-[#22242E] text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="1">100% no mês atual (1x)</option>
                    <option value="2">2 meses (2x)</option>
                    <option value="3">3 meses (3x)</option>
                    <option value="6">6 meses (6x)</option>
                    <option value="12">12 meses (12x)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-1.5">
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 text-xs flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800"
                >
                  Salvar
                </Button>
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="h-7 px-2.5 rounded text-xs text-slate-400 hover:text-slate-200 border border-slate-200 dark:border-[#22242E]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Lista Minimalista de Custos */}
        {items.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Nenhum custo cadastrado para esta modelo.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#181920]">
            {items.map((item) => {
              const meses = Math.max(1, item.amortizarMeses || 1)
              const valorMensal = item.tipo === 'inicial' ? item.valor / meses : item.valor

              return (
                <div
                  key={item.id}
                  className={`py-2 px-1 flex items-center justify-between gap-3 text-xs transition-opacity ${
                    item.ativo ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.ativo}
                      onChange={() => onToggleItem(item.id)}
                      className="w-3.5 h-3.5 rounded text-slate-700 focus:ring-0 cursor-pointer"
                    />

                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.nome}
                    </span>

                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-[#181922] px-1.5 py-0.5 rounded">
                      {CATEGORY_LABELS[item.categoria] || item.categoria}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {item.tipo === 'inicial'
                        ? meses > 1
                          ? `Inicial (${meses}x)`
                          : 'Inicial'
                        : 'Mensal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(valorMensal)}
                      </span>
                      {item.tipo === 'inicial' && meses > 1 && (
                        <span className="text-[10px] text-slate-400 block">
                          Total: {formatCurrency(item.valor)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rodapé Minimalista de Totais */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1E2025] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
          <div>
            Setup Total: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(custoInicialTotal)}</span>
          </div>
          <div>
            Setup no Mês: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(custoInicialAplicado)}</span>
          </div>
          <div>
            Fixos Mensais: <span className="text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(custoFixoMensalTotal)}</span>
          </div>
          <div>
            Total Extras:{' '}
            <span className="text-slate-700 dark:text-slate-300 font-medium inline-flex items-center gap-0.5">
              {(custoInicialAplicado + custoFixoMensalTotal) > 0 && (
                <ArrowDownRight className="w-3 h-3 text-rose-500 shrink-0" />
              )}
              {formatCurrency(custoInicialAplicado + custoFixoMensalTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
