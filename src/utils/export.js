import { getCachedOsv, getAllCachedOsv } from './osvApi'

export function exportCsv(cves) {
  const header = 'CVE ID,ASB ID,Severity,Component(s),Match Type,Affected Files,Patch URLs'
  const rows = cves.map((cve) => {
    const osv = getCachedOsv(cve.asbId)
    const severity = osv?.severityLabel || ''
    const components = cve.components.join('; ')
    const patchUrls = [...new Set(cve.details.map((d) => d.patch))].join('; ')
    return [
      cve.cveId,
      cve.asbId,
      severity,
      `"${components}"`,
      cve.matchType,
      cve.details.length,
      `"${patchUrls}"`,
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  downloadFile(csv, 'vanir-report.csv', 'text/csv')
}

export function exportEnrichedJson(rawJson) {
  const cache = getAllCachedOsv()
  const enriched = JSON.parse(JSON.stringify(rawJson))

  for (const patch of enriched.missing_patches) {
    const osv = cache.get(patch.ID)
    if (osv && !osv.notFound) {
      patch.osv_data = {
        summary: osv.summary,
        details: osv.details,
        cvss_score: osv.cvssScore,
        severity: osv.severityLabel,
        published: osv.published,
      }
    }
  }

  const json = JSON.stringify(enriched, null, 2)
  downloadFile(json, 'vanir-report-enriched.json', 'application/json')
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
