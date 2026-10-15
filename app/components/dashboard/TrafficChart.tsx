'use client';

import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { resolveDirection } from '@/app/components/documents/DirectionBadge';
import { addDays, clamp, LAO_MONTHS, parseDateKey, toDateKey } from './dashboard-utils';
import { Activity, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

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

// Chart geometry in viewBox units (100 x 40)
const W = 100;
const H = 40;
const PAD_LEFT = 12;
const PAD_RIGHT = 98;
const PAD_TOP = 6;
const PAD_BOTTOM = 34;

function xFor(i: number, n: number): number {
  return PAD_LEFT + (n <= 1 ? 0 : (i / (n - 1))) * (PAD_RIGHT - PAD_LEFT);
}

function yFor(v: number, max: number): number {
  return PAD_TOP + (1 - v / max) * (PAD_BOTTOM - PAD_TOP);
}

/** Catmull-Rom → cubic-Bézier with boundary clamping to prevent baseline dipping */
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
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    // Strict clamping so curve never goes below zero baseline
    cp1y = Math.min(PAD_BOTTOM, Math.max(PAD_TOP, cp1y));
    cp2y = Math.min(PAD_BOTTOM, Math.max(PAD_TOP, cp2y));

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
  const inboundTotal = useMemo(() => points.reduce((sum, p) => sum + p.inbound, 0), [points]);
  const outboundTotal = useMemo(() => points.reduce((sum, p) => sum + p.outbound, 0), [points]);

  const inboundPoints = points.map((p, i) => ({ x: xFor(i, points.length), y: yFor(p.inbound, max) }));
  const outboundPoints = points.map((p, i) => ({ x: xFor(i, points.length), y: yFor(p.outbound, max) }));

  const inboundLine = buildSmoothPath(inboundPoints);
  const outboundLine = buildSmoothPath(outboundPoints);

  const inboundArea =
    inboundPoints.length > 0
      ? `${inboundLine} L ${inboundPoints[inboundPoints.length - 1].x.toFixed(2)} ${PAD_BOTTOM} L ${inboundPoints[0].x.toFixed(2)} ${PAD_BOTTOM} Z`
      : '';

  const outboundArea =
    outboundPoints.length > 0
      ? `${outboundLine} L ${outboundPoints[outboundPoints.length - 1].x.toFixed(2)} ${PAD_BOTTOM} L ${outboundPoints[0].x.toFixed(2)} ${PAD_BOTTOM} Z`
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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      {/* Chart header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              ສະຖິຕິການຮັບ-ສົ່ງເອກະສານ {period} ວັນຜ່ານມາ
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            ມີການເຄື່ອນໄຫວລວມ {totalInWindow} ເອກະສານ (ຂາເຂົ້າ {inboundTotal} · ຂາອອກ {outboundTotal})
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Stats Overview */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 font-medium">
          <span className="inline-flex items-center gap-1.5 text-indigo-600">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-indigo-100" />
            <ArrowDownLeft className="h-3 w-3" />
            ຂາເຂົ້າ ({inboundTotal})
          </span>
          <span className="inline-flex items-center gap-1.5 text-sky-500">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 ring-2 ring-sky-100" />
            <ArrowUpRight className="h-3 w-3" />
            ຂາອອກ ({outboundTotal})
          </span>
        </div>
        <span className="text-slate-400 text-[11px]">ສູງສຸດ: {max} ສະບັບ/ມື້</span>
      </div>

      {/* Plot Canvas */}
      <div
        ref={wrapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="relative mt-4 h-56 w-full cursor-crosshair sm:h-64 select-none"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="gradient-inbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-outbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid horizontal lines */}
          {[0, max / 2, max].map((v) => {
            const y = yFor(v, max);
            return (
              <line
                key={v}
                x1={PAD_LEFT}
                x2={PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={1}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Baseline 0 */}
          <line
            x1={PAD_LEFT}
            x2={PAD_RIGHT}
            y1={PAD_BOTTOM}
            y2={PAD_BOTTOM}
            stroke="#e2e8f0"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {/* Gradient Areas */}
          {outboundArea && <path d={outboundArea} fill="url(#gradient-outbound)" />}
          {inboundArea && <path d={inboundArea} fill="url(#gradient-inbound)" />}

          {/* Smooth Lines */}
          {outboundLine && (
            <path
              d={outboundLine}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {inboundLine && (
            <path
              d={inboundLine}
              fill="none"
              stroke="#4f46e5"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Y-axis values */}
        {[max, Math.round(max / 2), 0].map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="absolute left-0 -translate-y-1/2 text-[10px] font-semibold tabular-nums text-slate-400"
            style={{ top: `${(yFor(v, max) / H) * 100}%` }}
          >
            {v}
          </span>
        ))}

        {/* Hover marker + glass tooltip */}
        {hoverPoint && hoverIndex !== null && (
          <>
            <div
              className="pointer-events-none absolute bottom-[10%] top-[10%] w-px bg-slate-300/80 dashed"
              style={{ left: `${hoverPct}%` }}
            />
            <div
              className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-600 shadow-md ring-2 ring-indigo-200"
              style={{ left: `${hoverPct}%`, top: `${hoverInboundTop}%` }}
            />
            <div
              className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow-md ring-2 ring-sky-200"
              style={{ left: `${hoverPct}%`, top: `${hoverOutboundTop}%` }}
            />
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-slate-700/60 bg-slate-900/90 px-3.5 py-2.5 text-white shadow-xl backdrop-blur-md"
              style={{ left: `min(88%, max(12%, ${hoverPct}%))`, top: '8px' }}
            >
              <p className="whitespace-nowrap text-xs font-semibold text-slate-200">
                {hoverDate
                  ? `${hoverDate.getDate()} ${LAO_MONTHS[hoverDate.getMonth()]} ${hoverDate.getFullYear()}`
                  : hoverPoint.key}
              </p>
              <div className="mt-1.5 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    ຂາເຂົ້າ
                  </span>
                  <span className="font-bold tabular-nums">{hoverPoint.inbound} ສະບັບ</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    ຂາອອກ
                  </span>
                  <span className="font-bold tabular-nums">{hoverPoint.outbound} ສະບັບ</span>
                </div>
                <div className="pt-1 border-t border-slate-700/80 flex items-center justify-between gap-4 font-bold text-white">
                  <span>ລວມ</span>
                  <span className="tabular-nums">{hoverPoint.total} ສະບັບ</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* X-axis labels */}
      <div className="relative mt-2 h-4 w-full border-t border-slate-100 pt-1">
        {points.map((p, i) => {
          const show = i % labelStep === 0 || i === points.length - 1;
          if (!show) return null;
          return (
            <span
              key={p.key}
              className="absolute -translate-x-1/2 text-[10px] font-medium tabular-nums text-slate-400"
              style={{ left: `${xFor(i, points.length)}%` }}
            >
              {parseInt(p.key.slice(8), 10)}
            </span>
          );
        })}
      </div>
    </section>
  );
}