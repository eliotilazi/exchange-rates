// Pure helpers (no React, no network) so they can be tested with Node.

// rates: { EUR: 1.08, USD: 1.19, ... } for 1 unit of `base`.
// Returns how many `to` you get for 1 `from`, using the base as a bridge.
export function crossRate(rates, base, from, to) {
  const r = (c) => (c === base ? 1 : rates[c])
  if (!r(from) || !r(to)) return null
  return r(to) / r(from)
}

export function convert(amount, rates, base, from, to) {
  const rate = crossRate(rates, base, from, to)
  if (rate == null || !Number.isFinite(amount)) return null
  return amount * rate
}

export const pct = (now, before) => (before ? ((now - before) / before) * 100 : 0)

// Frankfurter time series { '2026-01-02': { EUR: 1.07 }, ... } -> [{ date, value }] for one currency
export function seriesOf(timeseries, code) {
  return Object.entries(timeseries || {})
    .filter(([, r]) => r[code] != null)
    .map(([date, r]) => ({ date, value: r[code] }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function stats(series) {
  if (!series.length) return null
  const values = series.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const first = values[0]
  const last = values[values.length - 1]
  return {
    min, max, first, last,
    avg: values.reduce((s, v) => s + v, 0) / values.length,
    change: pct(last, first),
    minDate: series[values.indexOf(min)].date,
    maxDate: series[values.indexOf(max)].date,
  }
}

// Keep at most n points, always keeping the first and the last one.
export function downsample(series, n) {
  if (series.length <= n) return series
  const step = (series.length - 1) / (n - 1)
  return Array.from({ length: n }, (_, i) => series[Math.round(i * step)])
}

// SVG path for a line chart in a width x height box (with padding).
export function linePath(series, width, height, pad = 4) {
  if (series.length < 2) return ''
  const values = series.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return series.map((p, i) => {
    const x = pad + (i / (series.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (p.value - min) / span) * (height - pad * 2)
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

// Start date (YYYY-MM-DD) for a range ending today.
export const RANGES = { '1M': 31, '3M': 92, '1Y': 366, '5Y': 1827 }
export function startDate(range, today = new Date()) {
  const d = new Date(today)
  d.setDate(d.getDate() - RANGES[range])
  return d.toISOString().slice(0, 10)
}

// Number formatting: more decimals for small values.
export function fmtRate(v) {
  if (v == null) return '–'
  const digits = v >= 100 ? 2 : v >= 1 ? 4 : 5
  return v.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
export function fmtMoney(v, code) {
  if (v == null) return '–'
  return v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + code
}
export const fmtPct = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)} %`

// Parse what people type: "1'250.50", "1 250,50", "1,250.50"
export function parseAmount(text) {
  let t = String(text).trim().replace(/[\s']/g, '')
  if (!t) return NaN
  if (t.includes(',') && t.includes('.')) t = t.replace(/,/g, '')
  else if (t.includes(',')) t = t.replace(',', '.')
  if (!/^\d*\.?\d*$/.test(t)) return NaN
  return Number(t)
}

export const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
