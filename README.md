# Vanir Analyzer

**Visualize and triage unpatched Android CVEs from [Google Vanir](https://github.com/google/vanir) security scan reports.**

Vanir Analyzer is a free, open-source web tool that parses the JSON output of `vanir scan` and turns it into an interactive dashboard — with charts, severity enrichment, filtering, and exportable reports. Fully client-side: your security data never leaves the browser.

> **Live demo:** [vanir-analyzer.pages.dev](https://vanir-analyzer.pages.dev) *(update with your actual URL)*

---

## Features

| Feature | Description |
|---|---|
| **Upload & parse** | Drag-and-drop any Vanir JSON report — validates format instantly |
| **Metric cards** | Total unpatched CVEs, covered CVEs, direct matches, non-target matches |
| **Component classification** | Auto-classifies CVEs into Kernel, System AOSP, Vendor MediaTek, External libs, DNG SDK, Prebuilts, Other |
| **Charts** | Donut (by component), vertical bar (by year), horizontal stacked bar (top 15 by match count) |
| **Filterable CVE table** | Search by CVE ID, filter by match type or component, sort by any column |
| **CVE detail panel** | Slide-over panel with affected files, function names, patch links, and match indicators |
| **OSV enrichment** | On-demand fetch from [osv.dev](https://osv.dev) — CVSS scores, severity labels, descriptions |
| **Bulk severity load** | One-click batch fetch for all CVEs with progress bar |
| **Export** | CSV spreadsheet, enriched JSON (with OSV data merged), multi-page PDF report |
| **Dark / Light theme** | Toggle between themes, persisted in localStorage |
| **Privacy-first** | 100% client-side — no backend, no uploads, no tracking |

## Screenshots

<!-- Add screenshots here after deploying -->
<!-- ![Dashboard](docs/dashboard.png) -->
<!-- ![Detail Panel](docs/detail-panel.png) -->

## Quick start

### Use online

Visit the deployed version and drop your Vanir JSON file onto the upload zone. No installation needed.

### Run locally

```bash
# Requires Node.js 20+
git clone https://github.com/devHamza/vanir-analyzer.git
cd vanir-analyzer
npm install
npm run dev
```

Opens at `http://localhost:5173`.

A `sample-report.json` is included to try it out immediately.

### Build for production

```bash
npm run build
```

Outputs to `dist/` — deploy to GitHub Pages, Cloudflare Pages, Netlify, Vercel, or any static host.

## How it works

1. **Upload** — Drop a `.json` file produced by [`vanir scan`](https://github.com/google/vanir). The tool validates that it contains `covered_cves` and `missing_patches`.

2. **Parse & classify** — Each CVE is classified by component based on the file paths in `unpatched_code`:
   - `kernel/` → Kernel
   - `system/` → System AOSP
   - `vendor/mediatek/` → Vendor MediaTek
   - `external/dng_sdk/` → DNG SDK
   - `external/` (other) → External libs
   - `prebuilts/` → Prebuilts
   - Everything else → Other

3. **Direct vs Non-target** — Vanir's `is_non_target_match` field is surfaced throughout the UI:
   - **Direct match** (`false`) — confirmed vulnerability, patch as top priority
   - **Non-target match** (`true`) — similar code pattern, may be a false positive, requires manual verification

4. **OSV enrichment** — Clicking a CVE row fetches data from `GET https://api.osv.dev/v1/vulns/{ASB-ID}`. Severity labels (`Critical`, `High`, `Medium`, `Low`) are extracted from `affected[].ecosystem_specific.severity`. Responses are cached in memory — no repeated API calls.

5. **Export** — CSV and enriched JSON are generated client-side. PDF uses jsPDF with autotable for paginated tables and Chart.js canvas capture for charts.

## Vanir report format

The tool expects the JSON structure produced by `vanir scan`:

```json
{
  "options": "vanir scan --target /path/to/android ...",
  "covered_cves": ["CVE-XXXX-XXXXX", ...],
  "missing_patches": [
    {
      "ID": "ASB-A-XXXXXXXXX",
      "CVE": ["CVE-XXXX-XXXXX"],
      "OSV": "https://osv.dev/vulnerability/ASB-A-XXXXXXXXX",
      "details": [
        {
          "unpatched_code": "path/to/file.cpp::FunctionName",
          "patch": "https://android.googlesource.com/...",
          "is_non_target_match": true,
          "matched_signature": "ASB-A-XXXXXXXXX-xxxxxxxx"
        }
      ]
    }
  ]
}
```

## Tech stack

- **React** + **Vite** — fast dev/build tooling
- **Tailwind CSS v4** — utility-first styling with CSS custom properties for theming
- **Chart.js** + **react-chartjs-2** — interactive charts
- **jsPDF** + **jspdf-autotable** — PDF report generation (lazy-loaded)
- **OSV API** — [`api.osv.dev`](https://api.osv.dev) for CVE enrichment

## Project structure

```
src/
├── App.jsx                        # Main app — upload/dashboard routing, state
├── ThemeContext.jsx                # Dark/light theme provider
├── index.css                      # Tailwind + CSS custom properties (dark & light)
├── main.jsx                       # Entry point
├── components/
│   ├── UploadZone.jsx             # Upload page with SEO content
│   ├── MetricCards.jsx            # Summary metric cards
│   ├── Charts.jsx                 # Donut, year bar, top-15 stacked bar
│   ├── CVETable.jsx               # Filterable/sortable CVE table
│   ├── CVEDetailPanel.jsx         # Slide-over panel with OSV fetch
│   ├── ExportBar.jsx              # CSV, JSON, PDF export buttons
│   └── ThemeToggle.jsx            # Dark/light mode toggle
└── utils/
    ├── parseVanir.js              # JSON parsing, component classification
    ├── osvApi.js                  # OSV API client with caching
    ├── export.js                  # CSV and enriched JSON export
    └── exportPdf.js               # PDF generation (lazy-loaded)
```

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT

## Acknowledgements

- [Google Vanir](https://github.com/google/vanir) — Android security patch validation tool
- [OSV](https://osv.dev) — Open Source Vulnerability database
- Not affiliated with Google. Vanir is a project of the Android Security team.
