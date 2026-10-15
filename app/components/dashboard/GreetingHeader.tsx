'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Moon, Plus, Sun, Sunrise, Archive } from 'lucide-react';
import { useCurrentUser } from '@/app/(main)/context/CurrentUserContext';
import { formatFullDateLao, shiftOfHour } from './dashboard-utils';

export function GreetingHeader() {
  const { user: currentUser } = useCurrentUser();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const displayName = currentUser?.name?.trim() || 'ຜູ້ໃຊ້ງານ';
  const shift = shiftOfHour(now.getHours());
  const ShiftIcon = now.getHours() < 12 ? Sunrise : now.getHours() < 17 ? Sun : Moon;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/70">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            ລະບົບຈັດການເອກະສານ EDL DMS
          </p>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ສະບາຍດີ, <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{displayName}</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200/50">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
            {formatFullDateLao(now)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200/60">
            <ShiftIcon className="h-3.5 w-3.5 text-amber-500" />
            {shift.label} · {shift.time}
          </span>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex items-center gap-3">
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm"
        >
          <Archive className="h-4 w-4 text-slate-500" />
          ຄັງເກັບເອກະສານ
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition-all duration-200 hover:from-indigo-700 hover:to-blue-700 hover:shadow-md hover:shadow-indigo-300"
        >
          <Plus className="h-4 w-4" />
          ອັບໂຫຼດເອກະສານໃໝ່
        </Link>
      </div>
    </div>
  );
}