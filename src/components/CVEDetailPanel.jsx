import { useEffect, useState } from 'react'
import { fetchOsvData, getCachedOsv } from '../utils/osvApi'

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-yellow-500 text-gray-900',
  LOW: 'bg-gray-500 text-white',
}

export default function CVEDetailPanel({ cve, onClose, onSeverityLoaded }) {
  const [osvData, setOsvData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!cve) return
    setOsvData(null)
    setError(null)
    const cached = getCachedOsv(cve.asbId)
    if (cached) {
      setOsvData(cached)
      setLoading(false)
      if (cached.severityLabel) {
        onSeverityLoaded?.(cve.asbId, cached.severityLabel)
      }
      return
    }
    setLoading(true)
    fetchOsvData(cve.asbId)
      .then((data) => {
        setOsvData(data)
        if (data.severityLabel) {
          onSeverityLoaded?.(cve.asbId, data.severityLabel)
        }
      })
      .catch(() => setError('OSV data unavailable'))
      .finally(() => setLoading(false))
  }, [cve?.asbId])

  if (!cve) return null

  const uniquePatches = [...new Set(cve.details.map((d) => d.patch))]
  const osvUrl = cve.osvUrl || `https://osv.dev/vulnerability/${cve.asbId}`

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[var(--color-card)] border-l border-[var(--color-border)] shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-card)] border-b border-[var(--color-border)] p-5 flex items-start justify-between z-10">
          <div>
            <div className="font-mono text-lg text-[var(--color-accent-light)] font-semibold">
              {cve.cveId}
            </div>
            <div className="font-mono text-xs text-[var(--color-text-muted)] mt-0.5">{cve.asbId}</div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] p-1 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-[var(--color-text-tertiary)] text-sm">Loading OSV data...</span>
            </div>
          )}

          {error && (
            <div className="bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-lg p-4 text-sm">
              <p className="text-[var(--color-danger-light)]">{error}</p>
              <a href={osvUrl} target="_blank" rel="noopener noreferrer"
                className="text-[var(--color-accent-light)] text-xs mt-2 inline-block hover:underline">
                View on osv.dev →
              </a>
            </div>
          )}

          {!loading && !error && osvData && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                {osvData.severityLabel && (
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${SEVERITY_COLORS[osvData.severityLabel]}`}>
                    {osvData.severityLabel}
                  </span>
                )}
                {osvData.cvssScore != null && (
                  <span className="text-[var(--color-text-secondary)] text-sm font-mono">
                    CVSS: {osvData.cvssScore}
                  </span>
                )}
                {osvData.published && (
                  <span className="text-[var(--color-text-muted)] text-xs">
                    Published: {new Date(osvData.published).toLocaleDateString()}
                  </span>
                )}
              </div>

              {osvData.summary && (
                <div>
                  <h4 className="text-xs uppercase text-[var(--color-text-muted)] font-semibold mb-1">Summary</h4>
                  <p className="text-[var(--color-text-secondary)] text-sm">{osvData.summary}</p>
                </div>
              )}

              {osvData.details && (
                <div>
                  <h4 className="text-xs uppercase text-[var(--color-text-muted)] font-semibold mb-1">Details</h4>
                  <p className="text-[var(--color-text-tertiary)] text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {osvData.details}
                  </p>
                </div>
              )}

              {osvData.notFound && (
                <p className="text-[var(--color-text-muted)] text-sm">No OSV data found for this vulnerability.</p>
              )}
            </>
          )}

          {/* Affected files */}
          <div>
            <h4 className="text-xs uppercase text-[var(--color-text-muted)] font-semibold mb-2">
              Affected Files ({cve.details.length})
            </h4>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {cve.details.map((d, i) => {
                const [file, func] = d.unpatchedCode.split('::')
                return (
                  <div key={i} className="flex items-start gap-2 text-xs bg-[var(--color-bg)] rounded-lg p-2.5">
                    <span
                      className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                        d.isNonTargetMatch ? 'bg-[var(--color-nontarget)]' : 'bg-[var(--color-direct)]'
                      }`}
                      title={d.isNonTargetMatch ? 'Non-target match' : 'Direct match'}
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[var(--color-text-secondary)] break-all">{file}</div>
                      {func && <div className="font-mono text-[var(--color-accent)] mt-0.5">::{func}</div>}
                      <div className="text-[var(--color-text-faint)] mt-0.5">
                        {d.isNonTargetMatch ? 'Non-target' : 'Direct'} &bull; {d.asbId}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Patches */}
          <div>
            <h4 className="text-xs uppercase text-[var(--color-text-muted)] font-semibold mb-2">
              Patches ({uniquePatches.length})
            </h4>
            <div className="space-y-1.5">
              {uniquePatches.map((url, i) => {
                let domain
                try { domain = new URL(url).hostname } catch { domain = 'link' }
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs bg-[var(--color-bg)] rounded-lg p-2.5 text-[var(--color-accent-light)] hover:bg-[var(--color-border)] transition group">
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="truncate">{url}</span>
                    <span className="text-[var(--color-text-faint)] shrink-0">[{domain}]</span>
                  </a>
                )
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)]">
            <a href={osvUrl} target="_blank" rel="noopener noreferrer"
              className="text-[var(--color-accent-light)] text-xs hover:underline">
              View on osv.dev →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
