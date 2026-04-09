const cards = [
  { key: 'totalUnpatched', label: 'Unpatched CVEs', color: 'var(--color-danger)' },
  { key: 'totalCovered', label: 'CVEs Covered', color: 'var(--color-accent)' },
  { key: 'directMatches', label: 'Direct Matches', color: 'var(--color-direct)' },
  { key: 'nonTargetOnly', label: 'Non-target Only', color: 'var(--color-nontarget)' },
]

export default function MetricCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, color }) => (
        <div
          key={key}
          className="bg-[var(--color-card)] rounded-xl p-5 border border-[var(--color-border)]"
        >
          <div className="text-3xl font-bold mb-1" style={{ color }}>
            {metrics[key].toLocaleString()}
          </div>
          <div className="text-[var(--color-text-tertiary)] text-sm">{label}</div>
        </div>
      ))}
    </div>
  )
}
