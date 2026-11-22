// Calls to the Frankfurter API (European Central Bank reference rates, free, no key).
const API = 'https://api.frankfurter.dev/v1'
const cache = new Map()

async function get(path, signal) {
  if (cache.has(path)) return cache.get(path)
  const res = await fetch(API + path, { signal })
  if (!res.ok) throw new Error(`The rate service answered ${res.status}`)
  const data = await res.json()
  cache.set(path, data)
  return data
}

export const getCurrencies = (signal) => get('/currencies', signal)
export const getLatest = (base, signal) => get(`/latest?base=${base}`, signal)
export const getSeries = (base, symbols, start, signal) =>
  get(`/${start}..?base=${base}&symbols=${symbols.join(',')}`, signal)
