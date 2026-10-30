import { storage } from '@/services/storage'

export const serviceExport = {
  /**
   * Exporta toda a base de dados em formato JSON formatado
   */
  exportToJson(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      models: storage.getModels(),
      paidProfiles: storage.getPaidProfiles(),
      organicEntries: storage.getOrganicEntries(),
      paidEntries: storage.getPaidEntries(),
    }
    return JSON.stringify(data, null, 2)
  },

  /**
   * Exporta a base de dados em formato XML estruturado
   */
  exportToXml(): string {
    const models = storage.getModels()
    const profiles = storage.getPaidProfiles()
    const organic = storage.getOrganicEntries()
    const paid = storage.getPaidEntries()

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<AnaliseDados exportadoEm="${new Date().toISOString()}">\n`

    // Modelos
    xml += `  <Modelos>\n`
    models.forEach((m) => {
      xml += `    <Modelo id="${escapeXml(m.id)}" ativa="${m.ativa}">\n`
      xml += `      <Nome>${escapeXml(m.nome)}</Nome>\n`
      xml += `      <CriadaEm>${escapeXml(m.criadaEm)}</CriadaEm>\n`
      xml += `    </Modelo>\n`
    })
    xml += `  </Modelos>\n`

    // Perfis Pagos
    xml += `  <PerfisTráfegoPago>\n`
    profiles.forEach((p) => {
      xml += `    <Perfil id="${escapeXml(p.id)}" ativo="${p.ativo}">\n`
      xml += `      <Nome>${escapeXml(p.nome)}</Nome>\n`
      xml += `      <CriadoEm>${escapeXml(p.criadoEm)}</CriadoEm>\n`
      xml += `    </Perfil>\n`
    })
    xml += `  </PerfisTráfegoPago>\n`

    // Lançamentos Orgânicos
    xml += `  <LancamentosOrganicos>\n`
    organic.forEach((e) => {
      xml += `    <Registro id="${escapeXml(e.id)}" data="${e.data}" modeloId="${escapeXml(e.modeloId)}">\n`
      xml += `      <CanalRedeSocial>${escapeXml(e.canalRedeSocial || '')}</CanalRedeSocial>\n`
      xml += `      <HorasTrabalhadas>${e.horasTrabalhadas || 0}</HorasTrabalhadas>\n`
      xml += `      <Faturamento>${e.faturamento || 0}</Faturamento>\n`
      xml += `      <CustoReposicaoContas>${e.custoReposicaoContas || 0}</CustoReposicaoContas>\n`
      xml += `      <QtdContasRepostas>${e.qtdContasRepostas || 0}</QtdContasRepostas>\n`
      xml += `      <OutrosCustosContingencia>${e.outrosCustosContingencia || 0}</OutrosCustosContingencia>\n`
      xml += `      <Observacoes>${escapeXml(e.observacoes || '')}</Observacoes>\n`
      xml += `    </Registro>\n`
    })
    xml += `  </LancamentosOrganicos>\n`

    // Lançamentos Pagos
    xml += `  <LancamentosPagos>\n`
    paid.forEach((e) => {
      xml += `    <Registro id="${escapeXml(e.id)}" data="${e.data}" profileId="${escapeXml(e.profileId)}">\n`
      xml += `      <HorasTrabalhadas>${e.horasTrabalhadas || 0}</HorasTrabalhadas>\n`
      xml += `      <Faturamento>${e.faturamento || 0}</Faturamento>\n`
      xml += `      <GastoAds>${e.gastoAds || 0}</GastoAds>\n`
      xml += `      <OutrosGastos>${e.outrosGastos || 0}</OutrosGastos>\n`
      xml += `      <Observacoes>${escapeXml(e.observacoes || '')}</Observacoes>\n`
      xml += `    </Registro>\n`
    })
    xml += `  </LancamentosPagos>\n`

    xml += `</AnaliseDados>`
    return xml
  },

  /**
   * Dispara o download de um arquivo no navegador
   */
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '\'':
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}
