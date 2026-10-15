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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-100">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          ກະດານຄວບຄຸມລະບົບຈັດການເອກະສານ
        </p>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          ສະບາຍດີ, {displayName}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatFullDateLao(now)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <ShiftIcon className="h-3.5 w-3.5" />
            {shift.label} · {shift.time}
          </span>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Archive className="h-4 w-4 text-slate-500" />
          ຄັງເກັບເອກະສານ
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          ອັບໂຫຼດເອກະສານໃໝ່
        </Link>
      </div>
    </div>
  );
}