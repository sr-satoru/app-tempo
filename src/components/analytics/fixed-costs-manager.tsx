import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { FixedCostItem, CostCategory, CostType } from '@/types/finance'
import {
  Smartphone,
  Camera,
  Users,
  Laptop,
  Package,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react'

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

const CATEGORY_MAP: Record<
  CostCategory,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  equipamento: {
    label: 'Equipamento',
    icon: Smartphone,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  conteudo: {
    label: 'Conteúdo / Fotos',
    icon: Camera,
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  },
  contingencia: {
    label: 'Perfis / Contingência',
    icon: Users,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  software: {
    label: 'Software / Multilogin',
    icon: Laptop,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  outros: {
    label: 'Outros',
    icon: Package,
    color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  },
}

const QUICK_PRESETS = [
  {
    nome: '📱 iPhone 11 p/ Gravação e TikTok',
    categoria: 'equipamento' as CostCategory,
    tipo: 'inicial' as CostType,
    valor: 1200,
    amortizarMeses: 3,
  },
  {
    nome: '📸 Ensaio Fotográfico Inicial',
    categoria: 'conteudo' as CostCategory,
    tipo: 'inicial' as CostType,
    valor: 450,
    amortizarMeses: 1,
  },
  {
    nome: '👥 Lote Inicial Perfis Aquecidos',
    categoria: 'contingencia' as CostCategory,
    tipo: 'inicial' as CostType,
    valor: 200,
    amortizarMeses: 1,
  },
  {
    nome: '🌐 Assinatura Dolphin Anty',
    categoria: 'software' as CostCategory,
    tipo: 'mensal' as CostType,
    valor: 99,
    amortizarMeses: 1,
  },
  {
    nome: '📶 Proxies 4G Residenciais',
    categoria: 'contingencia' as CostCategory,
    tipo: 'mensal' as CostType,
    valor: 150,
    amortizarMeses: 1,
  },
]

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

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    onAddItem({
      modeloId,
      nome: preset.nome,
      categoria: preset.categoria,
      tipo: preset.tipo,
      valor: preset.valor,
      amortizarMeses: preset.amortizarMeses,
      ativo: true,
    })
  }

  return (
    <Card className="border border-slate-200 dark:border-[#1E2025] bg-white dark:bg-[#121316] shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-[#1E2025]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 dark:text-pink-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Custos Iniciais (Setup) & Custos Fixos
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gastos para iniciar a modelo (aparelhos, fotos, perfis) e mensalidades fixas
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddingOpen(!isAddingOpen)}
            className="h-8 gap-1.5 text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            {isAddingOpen ? 'Fechar Formulário' : 'Novo Custo'}
          </Button>
        </div>

        {/* Sugestões Rápidas (1-clique) */}
        <div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#7C3AED]" />
            Sugestões Rápidas de Setup & Custos Comuns:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 dark:bg-[#181922] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#222430] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors flex items-center gap-1"
              >
                <span>{p.nome}</span>
                <span className="text-slate-400 font-mono">({formatCurrency(p.valor)})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Formulário de Adicionar Novo Custo */}
        {isAddingOpen && (
          <form
            onSubmit={handleSubmit}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161720] border border-slate-200 dark:border-[#222430] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Nome */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Nome / Descrição do Gasto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: iPhone 11 p/ Gravação, Ensaio Fotográfico..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full h-8.5 rounded-lg px-3 bg-white dark:bg-[#1A1C27] border border-slate-200 dark:border-[#2A2C3A] text-xs text-slate-900 dark:text-white focus:border-[#7C3AED]"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CostCategory)}
                  className="w-full h-8.5 rounded-lg px-2 bg-white dark:bg-[#1A1C27] border border-slate-200 dark:border-[#2A2C3A] text-xs text-slate-900 dark:text-white focus:border-[#7C3AED]"
                >
                  <option value="equipamento">📱 Equipamento / Celular</option>
                  <option value="conteudo">📸 Conteúdo / Ensaio</option>
                  <option value="contingencia">👥 Perfis / Contingência</option>
                  <option value="software">💻 Software / Multilogin</option>
                  <option value="outros">📦 Outros Gastos</option>
                </select>
              </div>

              {/* Tipo de Custo */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Frequência
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as CostType)}
                  className="w-full h-8.5 rounded-lg px-2 bg-white dark:bg-[#1A1C27] border border-slate-200 dark:border-[#2A2C3A] text-xs text-slate-900 dark:text-white focus:border-[#7C3AED]"
                >
                  <option value="inicial">Custo Inicial (Setup / Único)</option>
                  <option value="mensal">Custo Fixo Mensal (Recorrente)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 items-end">
              {/* Valor */}
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Valor Total (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full h-8.5 rounded-lg pl-8 pr-3 bg-white dark:bg-[#1A1C27] border border-slate-200 dark:border-[#2A2C3A] text-xs font-mono font-medium text-slate-900 dark:text-white focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Amortização (Apenas se for inicial) */}
              {tipo === 'inicial' && (
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                    Amortização no Mês
                  </label>
                  <select
                    value={amortizarMeses}
                    onChange={(e) => setAmortizarMeses(e.target.value)}
                    className="w-full h-8.5 rounded-lg px-2 bg-white dark:bg-[#1A1C27] border border-slate-200 dark:border-[#2A2C3A] text-xs text-slate-900 dark:text-white focus:border-[#7C3AED]"
                  >
                    <option value="1">Abater 100% neste mês (1x)</option>
                    <option value="2">Amortizar em 2 meses (2x)</option>
                    <option value="3">Amortizar em 3 meses (3x)</option>
                    <option value="6">Amortizar em 6 meses (6x)</option>
                    <option value="12">Amortizar em 12 meses (12x)</option>
                  </select>
                </div>
              )}

              {/* Botões do Form */}
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-8.5 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs"
                >
                  Salvar Custo
                </Button>
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="h-8.5 px-3 rounded-lg border border-slate-200 dark:border-[#2A2C3A] text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-[#20222F]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Lista de Custos Cadastrados */}
        {items.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#222430] bg-slate-50/50 dark:bg-[#14151D]">
            <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhum custo inicial ou fixo cadastrado para esta modelo ainda.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Use as sugestões rápidas acima ou clique em "Novo Custo" para registrar seus gastos de setup.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1C1E28] rounded-xl border border-slate-200 dark:border-[#1E2025] overflow-hidden bg-slate-50/30 dark:bg-[#14151D]">
            {items.map((item) => {
              const catInfo = CATEGORY_MAP[item.categoria] || CATEGORY_MAP.outros
              const Icon = catInfo.icon
              const meses = Math.max(1, item.amortizarMeses || 1)
              const valorMensal = item.tipo === 'inicial' ? item.valor / meses : item.valor

              return (
                <div
                  key={item.id}
                  className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                    item.ativo ? 'hover:bg-slate-50 dark:hover:bg-[#181923]' : 'opacity-50 bg-slate-100/50 dark:bg-black/20'
                  }`}
                >
                  {/* Esquerda: Checkbox + Ícone + Nome */}
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.ativo}
                      onChange={() => onToggleItem(item.id)}
                      title="Ativar/desativar este custo do cálculo"
                      className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                    />

                    <div className={`p-1.5 rounded-lg border shrink-0 ${catInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.nome}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            item.tipo === 'inicial'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                          }`}
                        >
                          {item.tipo === 'inicial' ? 'Inicial (Setup)' : 'Fixo Mensal'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {catInfo.label}
                        {item.tipo === 'inicial' && meses > 1 && (
                          <span className="ml-1 text-[#7C3AED] dark:text-[#A78BFA] font-mono">
                            • Amortizado em {meses}x ({formatCurrency(valorMensal)}/mês)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Direita: Valor e Botão Deletar */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(valorMensal)}
                        <span className="text-[10px] font-normal text-slate-400">/mês</span>
                      </div>
                      {item.tipo === 'inicial' && meses > 1 && (
                        <span className="text-[10px] text-slate-400 block">
                          Total: {formatCurrency(item.valor)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      title="Excluir custo"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Rodapé Consolidado dos Custos */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#171821] border border-slate-200 dark:border-[#222430] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-medium block">
              Setup Total Investido:
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatCurrency(custoInicialTotal)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-medium block">
              Setup Aplicado no Mês:
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatCurrency(custoInicialAplicado)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-medium block">
              Custos Fixos Mensais:
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatCurrency(custoFixoMensalTotal)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-rose-500 uppercase font-medium block">
              Total Extra Descontado:
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-rose-500">
              {formatCurrency(custoInicialAplicado + custoFixoMensalTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
