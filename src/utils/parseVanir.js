const COMPONENT_RULES = [
  { key: 'Kernel', test: (p) => p.startsWith('kernel') },
  { key: 'DNG SDK', test: (p) => p.includes('external/dng_sdk') },
  { key: 'Vendor MediaTek', test: (p) => p.startsWith('vendor/mediatek') },
  { key: 'System AOSP', test: (p) => p.startsWith('system/') },
  { key: 'Prebuilts', test: (p) => p.startsWith('prebuilts/') },
  { key: 'External libs', test: (p) => p.startsWith('external/') && !p.includes('external/dng_sdk') },
]

export function classifyComponent(filePath) {
  const path = filePath.split('::')[0]
  const matched = COMPONENT_RULES.filter((r) => r.test(path)).map((r) => r.key)
  return matched.length > 0 ? matched : ['Other']
}

export function extractYear(cveId) {
  const m = cveId.match(/CVE-(\d{4})-/)
  return m ? parseInt(m[1], 10) : null
}

export function parseVanirReport(json) {
  if (!json.covered_cves || !json.missing_patches) {
    throw new Error('Invalid Vanir report: missing covered_cves or missing_patches')
  }

  const cveMap = new Map()

  for (const patch of json.missing_patches) {
    const cveIds = patch.CVE || []
    for (const cveId of cveIds) {
      if (!cveMap.has(cveId)) {
        cveMap.set(cveId, {
          cveId,
          asbId: patch.ID,
          osvUrl: patch.OSV,
          details: [],
          components: new Set(),
          hasDirectMatch: false,
          hasNonTargetMatch: false,
        })
      }
      const entry = cveMap.get(cveId)
      for (const detail of patch.details) {
        entry.details.push({
          unpatchedCode: detail.unpatched_code,
          patch: detail.patch,
          isNonTargetMatch: detail.is_non_target_match,
          matchedSignature: detail.matched_signature,
          asbId: patch.ID,
        })
        const comps = classifyComponent(detail.unpatched_code)
        comps.forEach((c) => entry.components.add(c))
        if (detail.is_non_target_match) {
          entry.hasNonTargetMatch = true
        } else {
          entry.hasDirectMatch = true
        }
      }
    }
  }

  const cves = Array.from(cveMap.values()).map((entry) => ({
    ...entry,
    components: Array.from(entry.components),
    matchType: entry.hasDirectMatch && entry.hasNonTargetMatch
      ? 'Mixed'
      : entry.hasDirectMatch
        ? 'Direct'
        : 'Non-target',
  }))

  const totalUnpatched = cves.length
  const totalCovered = json.covered_cves.length
  const directMatches = cves.filter((c) => c.hasDirectMatch).length
  const nonTargetOnly = cves.filter((c) => !c.hasDirectMatch).length

  // Component breakdown
  const componentCounts = {}
  for (const cve of cves) {
    for (const comp of cve.components) {
      componentCounts[comp] = (componentCounts[comp] || 0) + 1
    }
  }

  // Year breakdown
  const yearCounts = {}
  for (const cve of cves) {
    const year = extractYear(cve.cveId)
    if (year) {
      yearCounts[year] = (yearCounts[year] || 0) + 1
    }
  }

  // Top 15 by match count
  const top15 = [...cves]
    .map((cve) => ({
      cveId: cve.cveId,
      direct: cve.details.filter((d) => !d.isNonTargetMatch).length,
      nonTarget: cve.details.filter((d) => d.isNonTargetMatch).length,
      total: cve.details.length,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)

  return {
    options: json.options || '',
    cves,
    metrics: { totalUnpatched, totalCovered, directMatches, nonTargetOnly },
    componentCounts,
    yearCounts,
    top15,
    raw: json,
  }
}
