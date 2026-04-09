import { useMemo, useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const COMPONENT_COLORS = {
  'Kernel': '#E24B4A',
  'DNG SDK': '#D85A30',
  'Vendor MediaTek': '#FBBF24',
  'System AOSP': '#34D399',
  'Prebuilts': '#378ADD',
  'External libs': '#7F77DD',
  'Other': '#6B7280',
}

function getChartTheme() {
  const s = getComputedStyle(document.documentElement)
  return {
    tick: s.getPropertyValue('--color-chart-tick').trim(),
    grid: s.getPropertyValue('--color-chart-grid').trim(),
    tooltipBg: s.getPropertyValue('--color-chart-tooltip-bg').trim(),
    tooltipText: s.getPropertyValue('--color-chart-tooltip-text').trim(),
    tooltipBody: s.getPropertyValue('--color-chart-tooltip-body').trim(),
    tooltipBorder: s.getPropertyValue('--color-chart-tooltip-border').trim(),
    donutBorder: s.getPropertyValue('--color-chart-donut-border').trim(),
  }
}

export const chartRefs = {
  donut: null,
  year: null,
}

export default function Charts({ report, theme }) {
  const { componentCounts, yearCounts, top15 } = report
  const donutRef = useRef(null)
  const yearRef = useRef(null)

  useEffect(() => {
    chartRefs.donut = donutRef.current
    chartRefs.year = yearRef.current
  })

  // Re-derive chart colors whenever theme changes
  const ct = useMemo(() => getChartTheme(), [theme])

  const tooltip = useMemo(() => ({
    backgroundColor: ct.tooltipBg,
    titleColor: ct.tooltipText,
    bodyColor: ct.tooltipBody,
    borderColor: ct.tooltipBorder,
    borderWidth: 1,
    cornerRadius: 8,
    padding: 10,
  }), [ct])

  const donutData = useMemo(() => {
    const labels = Object.keys(componentCounts)
    return {
      labels,
      datasets: [{
        data: labels.map((l) => componentCounts[l]),
        backgroundColor: labels.map((l) => COMPONENT_COLORS[l] || '#6B7280'),
        borderColor: ct.donutBorder,
        borderWidth: 2,
      }],
    }
  }, [componentCounts, ct])

  const yearData = useMemo(() => {
    const years = Object.keys(yearCounts).sort()
    return {
      labels: years,
      datasets: [{
        label: 'CVEs',
        data: years.map((y) => yearCounts[y]),
        backgroundColor: '#7F77DD',
        borderRadius: 4,
      }],
    }
  }, [yearCounts])

  const stackedData = useMemo(() => {
    const labels = top15.map((t) => t.cveId)
    return {
      labels,
      datasets: [
        { label: 'Direct', data: top15.map((t) => t.direct), backgroundColor: '#D85A30' },
        { label: 'Non-target', data: top15.map((t) => t.nonTarget), backgroundColor: '#378ADD' },
      ],
    }
  }, [top15])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut chart */}
      <div className="bg-[var(--color-card)] rounded-xl p-5 border border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">CVEs by Component</h3>
        <div className="h-64 flex items-center justify-center">
          <Doughnut
            ref={donutRef}
            data={donutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: { color: ct.tick, padding: 12, usePointStyle: true, boxWidth: 8, boxHeight: 8, font: { size: 11 } },
                },
                tooltip,
              },
              cutout: '60%',
            }}
          />
        </div>
      </div>

      {/* Year bar chart */}
      <div className="bg-[var(--color-card)] rounded-xl p-5 border border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">CVEs by Year</h3>
        <div className="h-64">
          <Bar
            ref={yearRef}
            data={yearData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip },
              scales: {
                x: { ticks: { color: ct.tick }, grid: { color: ct.grid } },
                y: { ticks: { color: ct.tick }, grid: { color: ct.grid } },
              },
            }}
          />
        </div>
      </div>

      {/* Top 15 stacked bar */}
      <div className="bg-[var(--color-card)] rounded-xl p-5 border border-[var(--color-border)] lg:col-span-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Top 15 CVEs by Match Count</h3>
        <div style={{ height: `${Math.max(top15.length * 28 + 40, 200)}px` }}>
          <Bar
            data={stackedData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: {
                  labels: { color: ct.tick, usePointStyle: true, boxWidth: 8, boxHeight: 8, font: { size: 11 } },
                },
                tooltip,
              },
              scales: {
                x: { stacked: true, ticks: { color: ct.tick }, grid: { color: ct.grid } },
                y: {
                  stacked: true,
                  ticks: { color: ct.tick, font: { family: "'JetBrains Mono', monospace", size: 10 } },
                  grid: { display: false },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
