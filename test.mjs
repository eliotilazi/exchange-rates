// Tests for the calculation helpers. Run with: node test.mjs
import { crossRate, convert, pct, seriesOf, stats, downsample, linePath, startDate, parseAmount, fmtRate, fmtPct } from './src/lib.js'

let failed = 0
const check = (name, ok) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`) }
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e

const rates = { EUR: 1.08, USD: 1.2, JPY: 190 } // for 1 CHF
check('base to currency', near(crossRate(rates, 'CHF', 'CHF', 'EUR'), 1.08))
check('currency to base', near(crossRate(rates, 'CHF', 'EUR', 'CHF'), 1 / 1.08))
check('cross rate EUR to USD', near(crossRate(rates, 'CHF', 'EUR', 'USD'), 1.2 / 1.08))
check('same currency = 1', crossRate(rates, 'CHF', 'USD', 'USD') === 1)
check('unknown currency gives null', crossRate(rates, 'CHF', 'EUR', 'XXX') === null)
check('convert 1000 EUR to CHF', near(convert(1000, rates, 'CHF', 'EUR', 'CHF'), 1000 / 1.08))
check('convert NaN gives null', convert(NaN, rates, 'CHF', 'EUR', 'CHF') === null)

check('percent change', near(pct(110, 100), 10) && near(pct(90, 100), -10))
const ts = { '2026-01-03': { EUR: 1.1 }, '2026-01-01': { EUR: 1.0 }, '2026-01-02': { EUR: 1.2, USD: 1 } }
const s = seriesOf(ts, 'EUR')
check('series is sorted by date', s.map((p) => p.date).join() === '2026-01-01,2026-01-02,2026-01-03')
check('series skips missing values', seriesOf(ts, 'USD').length === 1)
const st = stats(s)
check('stats min / max', st.min === 1 && st.max === 1.2 && st.maxDate === '2026-01-02')
check('stats change first to last', near(st.change, 10))
check('stats of empty series', stats([]) === null)

const long = Array.from({ length: 1000 }, (_, i) => ({ date: String(i), value: i }))
const d = downsample(long, 100)
check('downsample keeps 100 points', d.length === 100)
check('downsample keeps first and last', d[0].value === 0 && d.at(-1).value === 999)
check('line path starts with M', linePath(s, 100, 50).startsWith('M'))
check('line path has one segment per point', linePath(s, 100, 50).split(' L').length === 3)

check('1M start date', startDate('1M', new Date('2026-11-22T12:00:00Z')) === '2026-10-22')
check('parse Swiss amount', parseAmount("1'250.50") === 1250.5)
check('parse comma decimal', parseAmount('1250,50') === 1250.5)
check('parse thousands comma', parseAmount('1,250.50') === 1250.5)
check('parse rejects text', Number.isNaN(parseAmount('abc')))
check('rate format decimals', fmtRate(1.08421) === '1.0842' && fmtRate(189.04) === '189.04' && fmtRate(0.009123) === '0.00912')
check('percent format sign', fmtPct(1.234) === '+1.23 %' && fmtPct(-0.5) === '−0.50 %')

console.log(failed ? `\n${failed} test(s) failed` : '\nAll tests passed')
process.exit(failed ? 1 : 0)
