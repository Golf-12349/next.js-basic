'use client';

import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { resolveDirection } from '@/app/components/documents/DirectionBadge';
import { addDays, clamp, LAO_MONTHS, parseDateKey, toDateKey } from './dashboard-utils';
import { Activity, ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';

type Period = 7 | 14 | 30;

type DayPoint = {
  key: string;
  inbound: number;
  outbound: number;
  total: number;
};

type PlotPoint = { x: number; y: number };

const PERIODS: Period[] = [7, 14, 30];
const PERIOD_LABELS: Record<Period, string> = { 7: '7 ວັນ', 14: '14 ວັນ', 30: '30 ວັນ' };

// Geometry for compact low-profile curve (100 x 32)
const W = 100;
const H = 32;
const PAD_LEFT = 10;
const PAD_RIGHT = 98;
const PAD_TOP = 4;
const PAD_BOTTOM = 28;

function xFor(i: number, n: number): number {
  return PAD_LEFT + (n <= 1 ? 0 : (i / (n - 1))) * (PAD_RIGHT - PAD_LEFT);
}

function yFor(v: number, max: number): number {
  return PAD_TOP + (1 - v / max) * (PAD_BOTTOM - PAD_TOP);
}

/** Smooth Catmull-Rom curve clamped to prevent negative dips */
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

    // Strict boundary clamping
    cp1y = Math.min(PAD_BOTTOM, Math.max(PAD_TOP, cp1y));
    cp2y = Math.min(PAD_BOTTOM, Math.max(PAD_TOP, cp2y));

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function CompactTrafficCurve() {
  const { documents } = useDocuments();
  const [period, setPeriod] = useState<Period>(14);
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
    <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-sky-50/20 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xs">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                ທ່າອ່ຽງການຮັບ-ສົ່ງເອກະສານ ({period} ວັນ)
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                <TrendingUp className="h-3 w-3" />
                {totalInWindow} ເຄື່ອນໄຫວ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ເສັ້ນໂຄ້ງປຽບທຽບອັດຕາການຮັບເຂົ້າ ແລະ ສົ່ງອອກປະຈຳວັນ
            </p>
          </div>
        </div>

        {/* Controls: Legend & Time Selector */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 text-indigo-600">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              ຂາເຂົ້າ: {inboundTotal}
            </span>
            <span className="inline-flex items-center gap-1 text-sky-500">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              ຂາອອກ: {outboundTotal}
            </span>
          </div>

          <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-0.5 border border-slate-200/60">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  period === p
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Curve Canvas */}
      <div
        ref={wrapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="relative mt-3 h-28 sm:h-32 w-full cursor-crosshair select-none"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="compact-grad-inbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="compact-grad-outbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle Grid horizontal line */}
          <line
            x1={PAD_LEFT}
            x2={PAD_RIGHT}
            y1={PAD_BOTTOM}
            y2={PAD_BOTTOM}
            stroke="#e2e8f0"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          {/* Area Fills */}
          {outboundArea && <path d={outboundArea} fill="url(#compact-grad-outbound)" />}
          {inboundArea && <path d={inboundArea} fill="url(#compact-grad-inbound)" />}

          {/* Smooth Curves */}
          {outboundLine && (
            <path
              d={outboundLine}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={2}
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
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Hover marker + glass tooltip */}
        {hoverPoint && hoverIndex !== null && (
          <>
            <div
              className="pointer-events-none absolute bottom-0 top-0 w-px bg-slate-300/80"
              style={{ left: `${hoverPct}%` }}
            />
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-600 shadow-md ring-2 ring-indigo-200"
              style={{ left: `${hoverPct}%`, top: `${hoverInboundTop}%` }}
            />
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500 shadow-md ring-2 ring-sky-200"
              style={{ left: `${hoverPct}%`, top: `${hoverOutboundTop}%` }}
            />
            <div
              className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-white shadow-xl backdrop-blur-md"
              style={{ left: `min(86%, max(14%, ${hoverPct}%))`, top: '-4px' }}
            >
              <p className="whitespace-nowrap text-[11px] font-semibold text-slate-200">
                {hoverDate
                  ? `${hoverDate.getDate()} ${LAO_MONTHS[hoverDate.getMonth()]} ${hoverDate.getFullYear()}`
                  : hoverPoint.key}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="text-indigo-300 font-bold">
                  ↓ {hoverPoint.inbound}
                </span>
                <span className="text-sky-300 font-bold">
                  ↑ {hoverPoint.outbound}
                </span>
                <span className="text-slate-400 font-normal">
                  ລວມ {hoverPoint.total}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mini X-axis date points */}
      <div className="relative mt-1 h-3.5 w-full">
        {points.map((p, i) => {
          const step = period <= 7 ? 1 : period <= 14 ? 2 : 5;
          const show = i % step === 0 || i === points.length - 1;
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

