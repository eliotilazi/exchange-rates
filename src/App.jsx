// Kurs: live exchange rates for Swiss businesses (ECB reference rates).
import { useEffect, useMemo, useState } from 'react'
import { getCurrencies, getLatest, getSeries } from './api.js'
import { useApi } from './useApi.js'
import Chart, { Spark } from './Chart.jsx'
import { convert, crossRate, seriesOf, stats, startDate, pct, fmtRate, fmtMoney, fmtPct, fmtDate, parseAmount, RANGES } from './lib.js'

const load = (k, d) => { try { return JSON.parse(localStorage.getItem('kurs-' + k)) ?? d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem('kurs-' + k, JSON.stringify(v)) } catch {} }

function ErrorBox({ error, retry }) {
  return (
    <div className="error" role="alert">
      <p><b>Rates could not be loaded.</b> {error}. Check your connection and try again.</p>
      <button className="btn" onClick={retry}>Try again</button>
    </div>
  )
}

const Skeleton = ({ h = 20, w = '100%' }) => <span className="skeleton" style={{ height: h, width: w }} />

export default function App() {
  const [base, setBase] = useState(() => load('base', 'CHF'))
  const [from, setFrom] = useState(() => load('from', 'EUR'))
  const [to, setTo] = useState(() => load('to', 'CHF'))
  const [amountText, setAmountText] = useState('1000')
  const [range, setRange] = useState('3M')
  const [watch, setWatch] = useState(() => load('watch', ['EUR', 'USD', 'GBP', 'JPY', 'SEK', 'PLN', 'TRY']))
  useEffect(() => { save('base', base); save('from', from); save('to', to); save('watch', watch) }, [base, from, to, watch])

  const currencies = useApi((s) => getCurrencies(s), [])
  const latest = useApi((s) => getLatest(base, s), [base])
  const monthStart = useMemo(() => startDate('1M'), [])
  const watchSymbols = watch.filter((c) => c !== base)
  const month = useApi((s) => (watchSymbols.length ? getSeries(base, watchSymbols, monthStart, s) : Promise.resolve({ rates: {} })), [base, watchSymbols.join()])
  const pairSeries = useApi((s) => (from === to ? Promise.resolve({ rates: {} }) : getSeries(from, [to], startDate(range), s)), [from, to, range])

  const names = currencies.data || {}
  const codes = Object.keys(names).sort()
  const rates = latest.data?.rates || {}
  const amount = parseAmount(amountText)
  const result = latest.data ? convert(amount, rates, base, from, to) : null
  const rate = latest.data ? crossRate(rates, base, from, to) : null
  const series = useMemo(() => seriesOf(pairSeries.data?.rates, to), [pairSeries.data, to])
  const st = stats(series)
  const swap = () => { setFrom(to); setTo(from) }
  const select = (value, onChange, label) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {(codes.length ? codes : [value]).map((c) => <option key={c} value={c}>{c}{names[c] ? ` · ${names[c]}` : ''}</option>)}
    </select>
  )

  return (
    <>
      <header className="top">
        <div className="wrap bar">
          <p className="brand">Kurs<span>.</span></p>
          <p className="muted small hide-sm">European Central Bank reference rates, updated every working day around 16:00 CET</p>
          <label className="base">Base {select(base, setBase, 'Base currency')}</label>
        </div>
      </header>

      <main className="wrap">
        {latest.error && <ErrorBox error={latest.error} retry={latest.retry} />}

        <section className="grid2">
          <div className="card converter">
            <h1>Currency converter</h1>
            <div className="conv-row">
              <label className="f amount"><span>Amount</span>
                <input inputMode="decimal" value={amountText} onChange={(e) => setAmountText(e.target.value)} aria-invalid={Number.isNaN(amount)} />
              </label>
              <label className="f"><span>From</span>{select(from, setFrom, 'From currency')}</label>
              <button className="swap" onClick={swap} aria-label="Swap currencies" title="Swap">⇄</button>
              <label className="f"><span>To</span>{select(to, setTo, 'To currency')}</label>
            </div>
            {Number.isNaN(amount) && <p className="err">Type a number, for example 1250.50</p>}
            <div className="result" aria-live="polite">
              {latest.loading && !latest.data ? <Skeleton h={44} w="60%" /> : (
                <>
                  <p className="big">{fmtMoney(result, to)}</p>
                  <p className="muted">1 {from} = {fmtRate(rate)} {to} · 1 {to} = {fmtRate(rate ? 1 / rate : null)} {from}</p>
                  {latest.data && <p className="muted small">Rate of {fmtDate(latest.data.date)}</p>}
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="chart-head">
              <h2>{from} → {to}</h2>
              <div className="ranges" role="group" aria-label="Period">
                {Object.keys(RANGES).map((r) => <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}>{r}</button>)}
              </div>
            </div>
            {from === to ? <p className="muted">Choose two different currencies to see a chart.</p>
              : pairSeries.error ? <ErrorBox error={pairSeries.error} retry={pairSeries.retry} />
              : pairSeries.loading ? <Skeleton h={240} />
              : <>
                <Chart series={series} label={`${from} to ${to} over ${range}`} />
                {st && (
                  <dl className="stats">
                    <div><dt>Change</dt><dd className={st.change >= 0 ? 'pos' : 'neg'}>{fmtPct(st.change)}</dd></div>
                    <div><dt>Lowest</dt><dd>{fmtRate(st.min)}<small>{fmtDate(st.minDate)}</small></dd></div>
                    <div><dt>Highest</dt><dd>{fmtRate(st.max)}<small>{fmtDate(st.maxDate)}</small></dd></div>
                    <div><dt>Average</dt><dd>{fmtRate(st.avg)}</dd></div>
                  </dl>
                )}
              </>}
          </div>
        </section>

        <section className="card">
          <div className="chart-head">
            <h2>Watchlist <small className="muted">1 {base} =</small></h2>
            <label className="add">Add
              <select value="" onChange={(e) => e.target.value && setWatch([...watch, e.target.value])} aria-label="Add a currency">
                <option value="">currency…</option>
                {codes.filter((c) => c !== base && !watch.includes(c)).map((c) => <option key={c} value={c}>{c} · {names[c]}</option>)}
              </select>
            </label>
          </div>
          <div className="table-wrap">
            <table className="watch">
              <thead><tr><th>Currency</th><th className="n">Rate</th><th className="n">1 day</th><th className="n">30 days</th><th>Trend</th><th><span className="sr">Actions</span></th></tr></thead>
              <tbody>
                {watchSymbols.map((c) => {
                  const s = seriesOf(month.data?.rates, c)
                  const now = rates[c]
                  const d1 = s.length > 1 ? pct(now ?? s.at(-1).value, s.at(-2).value) : null
                  const d30 = s.length ? pct(now ?? s.at(-1).value, s[0].value) : null
                  return (
                    <tr key={c}>
                      <td><b>{c}</b> <span className="muted small">{names[c]}</span></td>
                      <td className="n">{latest.data ? fmtRate(now) : <Skeleton w="70px" />}</td>
                      <td className={`n ${d1 > 0 ? 'pos' : d1 < 0 ? 'neg' : ''}`}>{d1 == null ? '–' : fmtPct(d1)}</td>
                      <td className={`n ${d30 > 0 ? 'pos' : d30 < 0 ? 'neg' : ''}`}>{d30 == null ? '–' : fmtPct(d30)}</td>
                      <td><Spark series={s} /></td>
                      <td className="actions">
                        <button className="link" onClick={() => { setFrom(base); setTo(c) }}>Chart</button>
                        <button className="link" onClick={() => setWatch(watch.filter((x) => x !== c))} aria-label={`Remove ${c}`}>✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {month.error && <ErrorBox error={month.error} retry={month.retry} />}
          <p className="muted small">A positive change means 1 {base} buys more of that currency than before.</p>
        </section>
      </main>

      <footer className="wrap foot">
        <p>Data: European Central Bank reference rates through the free <a href="https://frankfurter.dev">Frankfurter API</a>. Reference rates are for information only, banks apply their own rates.</p>
        <p>Built with React by <a href="https://eliotilazi.github.io">Eliot Ilazi</a> · <a href="https://github.com/eliotilazi/exchange-rates">Source code</a></p>
      </footer>
    </>
  )
}
