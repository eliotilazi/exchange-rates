// Line chart drawn in SVG, with a tooltip that follows the pointer.
import { useMemo, useRef, useState } from 'react'
import { downsample, fmtDate, fmtRate } from './lib.js'

const W = 640, H = 240, PAD = { l: 8, r: 8, t: 12, b: 12 }

export default function Chart({ series, label }) {
  const [hover, setHover] = useState(null)
  const ref = useRef(null)
  const pts = useMemo(() => downsample(series, 400), [series])
  const { min, max, coords } = useMemo(() => {
    const values = pts.map((p) => p.value)
    const min = Math.min(...values), max = Math.max(...values)
    const span = max - min || 1
    const coords = pts.map((p, i) => ({
      ...p,
      x: PAD.l + (i / Math.max(1, pts.length - 1)) * (W - PAD.l - PAD.r),
      y: PAD.t + (1 - (p.value - min) / span) * (H - PAD.t - PAD.b),
    }))
    return { min, max, coords }
  }, [pts])

  if (pts.length < 2) return <p className="muted">Not enough data for this period.</p>

  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const area = `${line} L${coords.at(-1).x} ${H - PAD.b} L${coords[0].x} ${H - PAD.b} Z`
  const up = pts.at(-1).value >= pts[0].value

  const move = (e) => {
    const box = ref.current.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * W
    const i = Math.round(((x - PAD.l) / (W - PAD.l - PAD.r)) * (coords.length - 1))
    setHover(coords[Math.max(0, Math.min(coords.length - 1, i))])
  }

  return (
    <div className="chart">
      <div className="chart-scale"><span>{fmtRate(max)}</span><span>{fmtRate(min)}</span></div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}
        onPointerMove={move} onPointerLeave={() => setHover(null)} className={up ? 'up' : 'down'}>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} className="grid" x1="0" x2={W} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} />)}
        <path className="area" d={area} />
        <path className="line" d={line} />
        {hover && (
          <g>
            <line className="cursor" x1={hover.x} x2={hover.x} y1={PAD.t} y2={H - PAD.b} />
            <circle className="dot" cx={hover.x} cy={hover.y} r="5" />
          </g>
        )}
      </svg>
      <div className="chart-foot">
        <span>{fmtDate(pts[0].date)}</span>
        <span className="tip" aria-live="polite">{hover ? <><b>{fmtRate(hover.value)}</b> on {fmtDate(hover.date)}</> : 'Move over the chart to see a date'}</span>
        <span>{fmtDate(pts.at(-1).date)}</span>
      </div>
    </div>
  )
}

export function Spark({ series }) {
  if (series.length < 2) return <svg className="spark" viewBox="0 0 90 28" />
  const v = series.map((p) => p.value)
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1
  const d = series.map((p, i) => `${i ? 'L' : 'M'}${(2 + (i / (series.length - 1)) * 86).toFixed(1)} ${(2 + (1 - (p.value - min) / span) * 24).toFixed(1)}`).join(' ')
  return <svg className={`spark ${v.at(-1) >= v[0] ? 'up' : 'down'}`} viewBox="0 0 90 28" aria-hidden="true"><path d={d} /></svg>
}
