const cache = new Map()

export function getCachedOsv(id) {
  return cache.get(id) || null
}

export function getAllCachedOsv() {
  return cache
}

export async function fetchOsvData(id) {
  if (cache.has(id)) return cache.get(id)

  const resp = await fetch(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`)

  if (resp.status === 404) {
    const result = { notFound: true, id }
    cache.set(id, result)
    return result
  }

  if (!resp.ok) throw new Error(`OSV API error: ${resp.status}`)

  const vuln = await resp.json()

  if (!vuln || !vuln.id) {
    const result = { notFound: true, id }
    cache.set(id, result)
    return result
  }

  // Severity: check top-level severity[], then affected[].ecosystem_specific.severity
  const severityEntry = vuln.severity?.find((s) => s.score) || null
  const cvssScore = severityEntry?.score
    ? extractCvssScore(severityEntry.score)
    : null

  // Severity label: try database_specific.severity, then affected[].ecosystem_specific.severity
  let severityLabel = vuln.database_specific?.severity || null
  if (!severityLabel && vuln.affected) {
    for (const a of vuln.affected) {
      const label = a.ecosystem_specific?.severity
      if (label) {
        severityLabel = label
        break
      }
    }
  }
  if (severityLabel) {
    severityLabel = normalizeSeverity(severityLabel)
  }

  const result = {
    id,
    summary: vuln.summary || '',
    details: vuln.details || '',
    cvssScore,
    cvssRaw: severityEntry?.score || null,
    severityLabel,
    published: vuln.published || null,
    notFound: false,
  }

  cache.set(id, result)
  return result
}

function extractCvssScore(cvssString) {
  // Plain numeric score (e.g. "7.8")
  const trimmed = cvssString.trim()
  const asNum = parseFloat(trimmed)
  if (!isNaN(asNum) && trimmed === String(asNum)) return asNum

  // CVSS vector strings (CVSS:3.1/AV:N/...) don't contain the base score
  // — it must be calculated, so we can't extract it here
  return null
}

function normalizeSeverity(label) {
  const map = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    MODERATE: 'MEDIUM',
    LOW: 'LOW',
  }
  return map[label.toUpperCase()] || label.toUpperCase()
}

export async function fetchAllOsvData(ids, onProgress) {
  const results = []
  const batchSize = 10

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map((id) => fetchOsvData(id))
    )
    for (const r of batchResults) {
      results.push(r.status === 'fulfilled' ? r.value : null)
    }
    onProgress?.(Math.min(i + batchSize, ids.length), ids.length)
  }

  return results
}
