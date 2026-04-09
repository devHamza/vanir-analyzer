import { useState, useMemo } from 'react'

const COMPONENT_BADGE = {
  'Kernel':        'bg-[var(--color-badge-kernel-bg)] text-[var(--color-badge-kernel-text)]',
  'DNG SDK':       'bg-[var(--color-badge-dng-bg)] text-[var(--color-badge-dng-text)]',
  'Vendor MediaTek':'bg-[var(--color-badge-mtk-bg)] text-[var(--color-badge-mtk-text)]',
  'System AOSP':   'bg-[var(--color-badge-system-bg)] text-[var(--color-badge-system-text)]',
  'Prebuilts':     'bg-[var(--color-badge-prebuilt-bg)] text-[var(--color-badge-prebuilt-text)]',
  'External libs': 'bg-[var(--color-badge-ext-bg)] text-[var(--color-badge-ext-text)]',
  'Other':         'bg-[var(--color-badge-other-bg)] text-[var(--color-badge-other-text)]',
}

const MATCH_TYPE_BADGE = {
  'Direct':     'bg-[var(--color-direct)]/20 text-[var(--color-direct)]',
  'Non-target': 'bg-[var(--color-nontarget)]/20 text-[var(--color-nontarget)]',
  'Mixed':      'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
}

function SeverityBadge({ label }) {
  if (!label) return <span className="text-[var(--color-text-muted)]">&mdash;</span>
  const map = {
    CRITICAL: 'bg-[var(--color-sev-critical-bg)] text-[var(--color-sev-critical-text)]',
    HIGH:     'bg-[var(--color-sev-high-bg)] text-[var(--color-sev-high-text)]',
    MEDIUM:   'bg-[var(--color-sev-medium-bg)] text-[var(--color-sev-medium-text)]',
    LOW:      'bg-[var(--color-sev-low-bg)] text-[var(--color-sev-low-text)]',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[label] || map.LOW}`}>
      {label}
    </span>
  )
}

export default function CVETable({ cves, severityMap, onSelectCve, onBulkLoad, bulkLoading, bulkProgress }) {
  const [search, setSearch] = useState('')
  const [matchFilter, setMatchFilter] = useState('All')
  const [compFilter, setCompFilter] = useState('All')
  const [sortField, setSortField] = useState('cveId')
  const [sortDir, setSortDir] = useState('asc')

  const components = useMemo(() => {
    const set = new Set()
    cves.forEach((c) => c.components.forEach((comp) => set.add(comp)))
    return Array.from(set).sort()
  }, [cves])

  const filtered = useMemo(() => {
    let result = cves
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.cveId.toLowerCase().includes(q))
    }
    if (matchFilter !== 'All') {
      result = result.filter((c) => c.matchType === matchFilter)
    }
    if (compFilter !== 'All') {
      result = result.filter((c) => c.components.includes(compFilter))
    }
    result = [...result].sort((a, b) => {
      let av, bv
      if (sortField === 'cveId') { av = a.cveId; bv = b.cveId }
      else if (sortField === 'matchType') { av = a.matchType; bv = b.matchType }
      else if (sortField === 'files') { av = a.details.length; bv = b.details.length }
      else if (sortField === 'severity') {
        const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
        av = order[severityMap[a.asbId]] || 0
        bv = order[severityMap[b.asbId]] || 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [cves, search, matchFilter, compFilter, sortField, sortDir, severityMap])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-[var(--color-text-faint)] ml-1">↕</span>
    return <span className="text-[var(--color-accent)] ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const filterBtn = (active, label, onClick) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'bg-[var(--color-bg)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-[var(--color-border)] space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search CVE ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text-input)] placeholder-[var(--color-text-placeholder)] outline-none focus:border-[var(--color-accent)] font-mono w-48"
          />
          <div className="flex gap-1.5 ml-2">
            {['All', 'Direct', 'Non-target'].map((t) =>
              filterBtn(matchFilter === t, t, () => setMatchFilter(t))
            )}
          </div>
          <div className="flex gap-1.5 ml-2 flex-wrap">
            {filterBtn(compFilter === 'All', 'All', () => setCompFilter('All'))}
            {components.map((comp) =>
              filterBtn(compFilter === comp, comp, () => setCompFilter(comp))
            )}
          </div>
          <div className="ml-auto">
            <button
              onClick={onBulkLoad}
              disabled={bulkLoading || bulkProgress?.done}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)]/20 text-[var(--color-accent-light)] hover:bg-[var(--color-accent)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {bulkProgress?.done
                ? 'Severities loaded'
                : bulkLoading
                  ? `Loading OSV data: ${bulkProgress?.loaded || 0} / ${bulkProgress?.total || 0}`
                  : 'Load all severities'}
            </button>
          </div>
        </div>
        {bulkLoading && bulkProgress && (
          <div className="w-full bg-[var(--color-bg)] rounded-full h-1.5">
            <div
              className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all"
              style={{ width: `${(bulkProgress.loaded / bulkProgress.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-text-tertiary)] text-xs uppercase">
              <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('cveId')}>
                CVE ID <SortIcon field="cveId" />
              </th>
              <th className="text-left px-4 py-3">Component(s)</th>
              <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('matchType')}>
                Match Type <SortIcon field="matchType" />
              </th>
              <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('files')}>
                Files <SortIcon field="files" />
              </th>
              <th className="text-left px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort('severity')}>
                Severity <SortIcon field="severity" />
              </th>
              <th className="text-right px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cve) => (
              <tr
                key={cve.cveId}
                className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-card-hover)] transition cursor-pointer"
                onClick={() => onSelectCve(cve)}
              >
                <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-accent-light)]">
                  {cve.cveId}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {cve.components.map((c) => (
                      <span key={c} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${COMPONENT_BADGE[c] || COMPONENT_BADGE['Other']}`}>
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${MATCH_TYPE_BADGE[cve.matchType]}`}>
                    {cve.matchType}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-secondary)] font-mono text-xs">
                  {cve.details.length}
                </td>
                <td className="px-4 py-2.5">
                  <SeverityBadge label={severityMap[cve.asbId]} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectCve(cve) }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-[var(--color-text-muted)] py-12 text-sm">
            No CVEs match the current filters.
          </div>
        )}
      </div>
      <div className="px-4 py-2.5 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
        Showing {filtered.length} of {cves.length} CVEs
      </div>
    </div>
  )
}
