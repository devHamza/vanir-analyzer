import { useState, useCallback } from 'react'
import { parseVanirReport } from './utils/parseVanir'
import { fetchAllOsvData, getCachedOsv } from './utils/osvApi'
import { useTheme } from './ThemeContext'
import UploadZone from './components/UploadZone'
import MetricCards from './components/MetricCards'
import Charts from './components/Charts'
import CVETable from './components/CVETable'
import CVEDetailPanel from './components/CVEDetailPanel'
import ExportBar from './components/ExportBar'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  const { theme } = useTheme()
  const [report, setReport] = useState(null)
  const [filename, setFilename] = useState('')
  const [selectedCve, setSelectedCve] = useState(null)
  const [severityMap, setSeverityMap] = useState({})
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(null)

  const handleParsed = useCallback((json, name) => {
    const parsed = parseVanirReport(json)
    setReport(parsed)
    setFilename(name)
    setSeverityMap({})
    setBulkProgress(null)
  }, [])

  const handleSeverityLoaded = useCallback((asbId, label) => {
    setSeverityMap((prev) => ({ ...prev, [asbId]: label }))
  }, [])

  const handleBulkLoad = useCallback(async () => {
    if (!report || bulkLoading) return
    const ids = [...new Set(report.cves.map((c) => c.asbId))]
    setBulkLoading(true)
    setBulkProgress({ loaded: 0, total: ids.length, done: false })

    await fetchAllOsvData(ids, (loaded, total) => {
      setBulkProgress({ loaded, total, done: loaded >= total })
    })

    const newMap = {}
    for (const id of ids) {
      const data = getCachedOsv(id)
      if (data?.severityLabel) newMap[id] = data.severityLabel
    }
    setSeverityMap((prev) => ({ ...prev, ...newMap }))
    setBulkLoading(false)
    setBulkProgress((prev) => ({ ...prev, done: true }))
  }, [report, bulkLoading])

  if (!report) {
    return <UploadZone onParsed={handleParsed} />
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-[var(--color-accent)]">Vanir Analyzer</h1>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">{filename}</span>
          </div>
          <div className="flex items-center gap-3">
            <ExportBar report={report} />
            <ThemeToggle />
            <button
              onClick={() => { setReport(null); setSelectedCve(null); setSeverityMap({}); setBulkProgress(null) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition"
            >
              New report
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {report.options && (
          <div className="bg-[var(--color-card)] rounded-xl p-3 border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-muted)]">Scan command: </span>
            <code className="text-xs text-[var(--color-text-secondary)] font-mono">{report.options}</code>
          </div>
        )}

        <MetricCards metrics={report.metrics} />
        <Charts report={report} theme={theme} />
        <CVETable
          cves={report.cves}
          severityMap={severityMap}
          onSelectCve={setSelectedCve}
          onBulkLoad={handleBulkLoad}
          bulkLoading={bulkLoading}
          bulkProgress={bulkProgress}
        />
      </main>

      {selectedCve && (
        <CVEDetailPanel
          cve={selectedCve}
          onClose={() => setSelectedCve(null)}
          onSeverityLoaded={handleSeverityLoaded}
        />
      )}
    </div>
  )
}
