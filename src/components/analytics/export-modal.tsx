import React, { useState } from 'react'
import { FileJson, FileCode, Check, Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/services/index.api'
import { toast } from '@/components/ui/notification'

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ExportModal: React.FC<ExportModalProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'xml'>('json')
  const [copied, setCopied] = useState(false)

  const handleDownload = (format: 'json' | 'xml') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    if (format === 'json') {
      const content = api.export.exportToJson()
      api.export.downloadFile(content, `analise-dados-backup_${timestamp}.json`, 'application/json')
      toast.success('Arquivo JSON exportado com sucesso!')
    } else {
      const content = api.export.exportToXml()
      api.export.downloadFile(content, `analise-dados-backup_${timestamp}.xml`, 'application/xml')
      toast.success('Arquivo XML exportado com sucesso!')
    }
  }

  const handleCopy = () => {
    const content =
      activeTab === 'json' ? api.export.exportToJson() : api.export.exportToXml()
    navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Conteúdo copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  const previewContent = React.useMemo(() => {
    if (!open) return ''
    return activeTab === 'json'
      ? api.export.exportToJson()
      : api.export.exportToXml()
  }, [open, activeTab])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Exportar Dados do Sistema (JSON / XML)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Você pode exportar todos os lançamentos, modelos OFM cadastradas e perfis de tráfego pago em formato <strong>JSON</strong> ou <strong>XML</strong> estruturado para backup ou importação no Rust/Tauri.
          </p>

          {/* Alternador de Formato */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2D3039] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'json'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1F2026]'
              }`}
            >
              <FileJson className="h-4 w-4" />
              Formato JSON
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'xml'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1F2026]'
              }`}
            >
              <FileCode className="h-4 w-4" />
              Formato XML
            </button>
          </div>

          {/* Pré-visualização do Arquivo */}
          <div className="relative">
            <pre className="h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-slate-300 border border-slate-800">
              {previewContent}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            variant="default"
            onClick={() => handleDownload(activeTab)}
          >
            Baixar Arquivo .{activeTab.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
