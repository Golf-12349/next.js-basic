'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, Moon, Plus, Sun, Sunrise } from 'lucide-react';
import { getStoredUser } from '@/types/user';
import { formatFullDateLao, shiftOfHour } from './dashboard-utils';

export function GreetingHeader() {
  const [userName, setUserName] = useState('');
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const sync = () => setUserName(getStoredUser()?.name?.trim() || '');
    sync();
    window.addEventListener('storage', sync);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.removeEventListener('storage', sync);
      window.clearInterval(timer);
    };
  }, []);

  const displayName = userName || 'ຜູ້ໃຊ້ງານ';
  const shift = shiftOfHour(now.getHours());
  const ShiftIcon = now.getHours() < 12 ? Sunrise : now.getHours() < 17 ? Sun : Moon;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          ກະດານຄວບຄຸມລະບົບຈັດການເອກະສານ
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
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

      <Link
        href="/documents/upload"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-300/60"
      >
        <Plus className="h-4 w-4" />
        ອັບໂຫຼດເອກະສານ
      </Link>
    </div>
  );
}