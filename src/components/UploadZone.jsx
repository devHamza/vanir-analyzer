import { useState, useCallback } from 'react'
import ThemeToggle from './ThemeToggle'

const FEATURES = [
  {
    title: 'CVE Dashboard',
    desc: 'Visualize unpatched CVEs with interactive charts — by component, year, and match count.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'OSV Enrichment',
    desc: 'Fetch CVSS scores, severity labels, and descriptions from the OSV database on demand.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.354-5.646M12 21a9.004 9.004 0 01-8.354-5.646M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    title: 'Export Reports',
    desc: 'Generate PDF reports, CSV spreadsheets, or enriched JSON for your security team.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: '100% Client-Side',
    desc: 'Your report never leaves the browser. No uploads, no servers, no tracking.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
]

export default function UploadZone({ onParsed }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = useCallback((file) => {
    setError(null)
    if (!file.name.endsWith('.json')) {
      setError('Please upload a .json file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        if (!json.covered_cves || !json.missing_patches) {
          setError('Invalid Vanir report: missing covered_cves or missing_patches')
          return
        }
        onParsed(json, file.name)
      } catch {
        setError('Failed to parse JSON file')
      }
    }
    reader.readAsText(file)
  }, [onParsed])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setDragOver(false), [])

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Hero + upload */}
      <div className="flex items-center justify-center px-6 pt-16 pb-12">
        <div className="w-full max-w-2xl">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold text-[var(--color-accent)] mb-3 tracking-tight">
              Vanir Analyzer
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed max-w-lg mx-auto">
              Analyze <strong>Google Vanir</strong> security scan reports. Visualize unpatched
              Android CVEs, missing patches, and CVSS severity — entirely in your browser.
            </p>
          </header>

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`
              relative border-2 border-dashed rounded-xl p-14 text-center cursor-pointer
              transition-all duration-200
              ${dragOver
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 scale-[1.02]'
                : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/50'
              }
            `}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-[var(--color-accent)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-[var(--color-text-secondary)] font-medium mb-1">
              Drop your Vanir JSON report here
            </p>
            <p className="text-[var(--color-text-muted)] text-sm">
              or click to browse — accepts <code className="font-mono text-[var(--color-accent)]">.json</code> files from <code className="font-mono text-[var(--color-accent)]">vanir scan</code>
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/30 rounded-lg text-[var(--color-danger-light)] text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5 flex gap-4 items-start">
              <div className="shrink-0 mt-0.5 text-[var(--color-accent)]">{f.icon}</div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">{f.title}</h3>
                <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEO-rich content section */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="border-t border-[var(--color-border)] pt-10 space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">What is Vanir?</h2>
            <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
              <strong>Vanir</strong> is an open-source security patch validation tool created by
              Google's Android Security team. It scans an Android codebase and produces a JSON report
              listing <strong>unpatched CVEs</strong> and <strong>missing security patches</strong> by
              matching source code against known vulnerability signatures from the
              Android Security Bulletins (ASB).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">How does Vanir Analyzer work?</h2>
            <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
              Upload the JSON file produced by <code className="font-mono text-[var(--color-accent)]">vanir scan</code> and
              get an instant interactive dashboard. The tool classifies each CVE by
              component — <strong>Kernel</strong>, <strong>System AOSP</strong>, <strong>Vendor MediaTek</strong>,
              <strong> External libs</strong>, <strong>DNG SDK</strong>, and <strong>Prebuilts</strong> — and
              separates <strong>direct matches</strong> (confirmed vulnerabilities) from
              <strong> non-target matches</strong> (potential false positives requiring manual review).
              Click any CVE to fetch real-time severity data from the <strong>OSV database</strong>,
              including CVSS base scores and detailed descriptions.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Key features</h2>
            <ul className="text-sm text-[var(--color-text-tertiary)] leading-relaxed space-y-1.5 list-disc list-inside">
              <li>Parse Vanir scan JSON reports with covered CVEs and missing patches</li>
              <li>Metric cards: total unpatched CVEs, covered CVEs, direct matches, non-target matches</li>
              <li>Charts: component donut, CVE-by-year bar chart, top 15 stacked match chart</li>
              <li>Filterable table with search, sort by severity, match type, or component</li>
              <li>On-demand OSV enrichment — CVSS scores, severity labels (Critical, High, Medium, Low)</li>
              <li>Bulk severity loading for all CVEs at once</li>
              <li>Export: CSV spreadsheet, enriched JSON, multi-page PDF report</li>
              <li>Privacy-first: fully client-side — your security data never leaves the browser</li>
              <li>Dark and light theme for comfortable triage sessions</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Who is this for?</h2>
            <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
              Android security engineers, OEM patch management teams, AOSP maintainers, and anyone
              who runs <strong>Google Vanir</strong> to audit their Android builds for
              missing security patches. Use it to triage the Android patch gap, prioritize
              CVE remediation, and generate reports for compliance and stakeholder review.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] py-6 text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          Vanir Analyzer is open-source. Not affiliated with Google.
          Vanir is a project of the <a href="https://github.com/google/vanir" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Android Security team</a>.
        </p>
      </footer>
    </div>
  )
}
