'use client';

import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { resolveDirection } from '@/app/components/documents/DirectionBadge';
import { addDays, clamp, LAO_MONTHS, parseDateKey, toDateKey } from './dashboard-utils';

type Period = 7 | 30 | 90;

type DayPoint = {
  key: string;
  inbound: number;
  outbound: number;
  total: number;
};

type PlotPoint = { x: number; y: number };

const PERIODS: Period[] = [7, 30, 90];
const PERIOD_LABELS: Record<Period, string> = { 7: '7 ວັນ', 30: '30 ວັນ', 90: '90 ວັນ' };

// Chart geometry in viewBox units (100 x 40), rendered with preserveAspectRatio="none".
const W = 100;
const H = 40;
const PAD_LEFT = 14; // leaves room for compact y-axis labels drawn as HTML
const PAD_RIGHT = 98;
const PAD_TOP = 5;
const PAD_BOTTOM = 34;

function xFor(i: number, n: number): number {
  return PAD_LEFT + (n <= 1 ? 0 : (i / (n - 1))) * (PAD_RIGHT - PAD_LEFT);
}

function yFor(v: number, max: number): number {
  return PAD_TOP + (1 - v / max) * (PAD_BOTTOM - PAD_TOP);
}

/** Catmull-Rom → cubic-Bézier conversion for a smooth curved line. */
function buildSmoothPath(points: PlotPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}
export function TrafficChart() {
  const { documents } = useDocuments();
  const [period, setPeriod] = useState<Period>(30);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const points = useMemo<DayPoint[]>(() => {
    const today = new Date();
    const start = addDays(today, 1 - period);
    const buckets = new Map<string, { inbound: number; outbound: number }>();
    for (let i = 0; i < period; i++) {
      buckets.set(toDateKey(addDays(start, i)), { inbound: 0, outbound: 0 });
    }
    for (const doc of active) {
      const key = doc.uploadDate.slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      // ນັບຕາມ field ທິດທາງໃໝ່ (direction) — ເອກະສານທີ່ບໍ່ລະບຸທິດທາງຈະນັບເປັນ ຂາອອກ ຄືເກົ່າ
      const dir = resolveDirection(doc);
      if (dir === 'inbound') bucket.inbound += 1;
      else bucket.outbound += 1;
    }
    return [...buckets.entries()].map(([key, v]) => ({
      key,
      inbound: v.inbound,
      outbound: v.outbound,
      total: v.inbound + v.outbound,
    }));
  }, [active, period]);

  const max = useMemo(() => Math.max(1, ...points.map((p) => p.total)), [points]);
  const totalInWindow = useMemo(() => points.reduce((sum, p) => sum + p.total, 0), [points]);

  const inboundPoints = points.map((p, i) => ({ x: xFor(i, points.length), y: yFor(p.inbound, max) }));
  const outboundPoints = points.map((p, i) => ({ x: xFor(i, points.length), y: yFor(p.outbound, max) }));

  const inboundLine = buildSmoothPath(inboundPoints);
  const outboundLine = buildSmoothPath(outboundPoints);

  const inboundArea =
    inboundPoints.length > 0
      ? `${inboundLine} L ${inboundPoints[inboundPoints.length - 1].x.toFixed(2)} ${PAD_BOTTOM} L ${inboundPoints[0].x.toFixed(2)} ${PAD_BOTTOM} Z`
      : '';

  const labelStep = period <= 7 ? 1 : period <= 30 ? 5 : 15;

  const hoverPct = hoverIndex !== null && points.length > 1 ? (hoverIndex / (points.length - 1)) * 100 : 0;
  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverInboundTop = hoverIndex !== null && inboundPoints[hoverIndex] ? (inboundPoints[hoverIndex].y / H) * 100 : 0;
  const hoverOutboundTop = hoverIndex !== null && outboundPoints[hoverIndex] ? (outboundPoints[hoverIndex].y / H) * 100 : 0;

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverIndex(clamp(Math.round(ratio * (points.length - 1)), 0, points.length - 1));
  }

  const hoverDate = hoverPoint ? parseDateKey(hoverPoint.key) : null;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      {/* Chart header — total handled + quick period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            ສະຖິຕິການຮັບ-ສົ່ງເອກະສານ 30 ວັນຜ່ານມາ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            ລວມ {totalInWindow} ເອກະສານຖືກຈັດການໃນ {period} ວັນຜ່ານມາ
          </p>
        </div>

        <div className="flex w-fit items-center gap-1 rounded-full bg-slate-100 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                period === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> ຂາເຂົ້າ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> ຂາອອກ
        </span>
      </div>
{/* Plot */}
      <div
        ref={wrapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="relative mt-3 h-52 w-full cursor-crosshair sm:h-64"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="dash-traffic-inbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, max / 2, max].map((v) => {
            const y = yFor(v, max);
            return (
              <line
                key={v}
                x1={PAD_LEFT}
                x2={PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="3 5"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Gradient area + smooth inbound line */}
          {inboundArea && <path d={inboundArea} fill="url(#dash-traffic-inbound)" />}
          {inboundLine && (
            <path
              d={inboundLine}
              fill="none"
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {outboundLine && (
            <path
              d={outboundLine}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Compact y-axis labels (HTML — avoids SVG text distortion) */}
        {[max, Math.round(max / 2), 0].map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="absolute left-0 -translate-y-1/2 text-[10px] font-medium tabular-nums text-slate-400"
            style={{ top: `${(yFor(v, max) / H) * 100}%` }}
          >
            {v}
          </span>
        ))}
{/* Hover marker + tooltip */}
        {hoverPoint && hoverIndex !== null && (
          <>
            <div
              className="pointer-events-none absolute bottom-[12%] top-[12.5%] w-px bg-slate-300/80"
              style={{ left: `${hoverPct}%` }}
            />
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-600 shadow"
              style={{ left: `${hoverPct}%`, top: `${hoverInboundTop}%` }}
            />
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-400 shadow"
              style={{ left: `${hoverPct}%`, top: `${hoverOutboundTop}%` }}
            />
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur"
              style={{ left: `min(92%, max(8%, ${hoverPct}%))`, top: '4px' }}
            >
              <p className="whitespace-nowrap text-[11px] font-semibold text-slate-700">
                {hoverDate
                  ? `${hoverDate.getDate()} ${LAO_MONTHS[hoverDate.getMonth()]} ${hoverDate.getFullYear()}`
                  : hoverPoint.key}
              </p>
              <div className="mt-1 space-y-0.5 whitespace-nowrap text-[11px] text-slate-500">
                <p className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  ຂາເຂົ້າ: {hoverPoint.inbound}
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  ຂາອອກ: {hoverPoint.outbound}
                </p>
                <p className="pt-0.5 font-semibold text-slate-700">ລວມ: {hoverPoint.total}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* X-axis day labels (HTML — align with the smooth-curve points) */}
      <div className="relative mt-2 h-4 w-full">
        {points.map((p, i) => {
          const show = i % labelStep === 0 || i === points.length - 1;
          if (!show) return null;
          return (
            <span
              key={p.key}
              className="absolute -translate-x-1/2 text-[10px] font-medium tabular-nums text-slate-400"
              style={{ left: `${(xFor(i, points.length) / W) * 100}%` }}
            >
              {Number(p.key.slice(8, 10))}
            </span>
          );
        })}
      </div>
    </section>
  );
}