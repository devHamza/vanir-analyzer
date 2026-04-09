import { useState } from 'react'
import { exportCsv, exportEnrichedJson } from '../utils/export'

export default function ExportBar({ report }) {
  const [pdfLoading, setPdfLoading] = useState(false)

  const handlePdfExport = async () => {
    const { exportPdf } = await import('../utils/exportPdf')
    exportPdf(report, () => setPdfLoading(true), () => setPdfLoading(false))
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => exportCsv(report.cves)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/50 transition"
        >
          Export CSV
        </button>
        <button
          onClick={() => exportEnrichedJson(report.raw)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/50 transition"
        >
          Export Enriched JSON
        </button>
        <button
          onClick={handlePdfExport}
          disabled={pdfLoading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)]/20 text-[var(--color-accent-light)] hover:bg-[var(--color-accent)]/30 disabled:opacity-50 transition"
        >
          Export PDF Report
        </button>
      </div>

      {pdfLoading && (
        <div className="fixed inset-0 z-[100] bg-[var(--color-bg)]/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--color-text-secondary)] font-medium">Generating PDF...</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">This may take a moment</p>
          </div>
        </div>
      )}
    </>
  )
}
