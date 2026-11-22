// Small hook: run an async loader, keep loading / error / data, cancel when inputs change.
import { useCallback, useEffect, useState } from 'react'

export function useApi(load, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null })
  const [tick, setTick] = useState(0)
  const retry = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const ctrl = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    load(ctrl.signal)
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ loading: false, error: e.message || 'Network error', data: null }) })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, retry }
}
