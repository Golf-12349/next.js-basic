'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, FileCheck2, FileText, Phone, Plus, Video } from 'lucide-react';
import { useDocuments } from '@/app/(main)/context/DocumentsContext';
import { addDays, formatFullDateLao, LAO_DAYS_SHORT, parseDateKey, toDateKey } from './dashboard-utils';

type TaskType = 'approval' | 'review' | 'contract' | 'meeting' | 'call';

type Task = {
  id: string;
  time: string;
  title: string;
  detail: string;
  type: TaskType;
  href: string;
};

const APPROVAL_TIMES = ['10:00', '10:30', '11:00', '11:30'];

const STATIC_TASKS: Task[] = [
  {
    id: 'static-meeting',
    time: '10:00',
    title: 'ກອງປະຊຸມພະແນກ (ອອນລາຍ)',
    detail: 'ທົບທວນຄວາມຄືບໜ້າວຽກງານປະຈຳອາທິດ',
    type: 'meeting',
    href: '/reports',
  },
  {
    id: 'static-review',
    time: '10:45',
    title: 'ກວດທົບທວນຮ່າງເອກະສານ',
    detail: 'ລາຍງານສະຫຼຸບການເຄື່ອນໄຫວປະຈຳເດືອນ',
    type: 'review',
    href: '/documents',
  },
  {
    id: 'static-call',
    time: '13:30',
    title: 'ຕິດຕໍ່ຢືນຢັນສັນຍາ',
    detail: 'ສັນຍາຈັດຊື້-ຈັດຈ້າງທີ່ກຳລັງຈະໝົດອາຍຸ',
    type: 'call',
    href: '/documents/archive',
  },
  {
    id: 'static-contract',
    time: '14:30',
    title: 'ໝົດອາຍຸສັນຍາ',
    detail: 'CT-2026-014 ຈະໝົດອາຍຸໃນ 7 ວັນ · ກະລຸນາພິຈາລະນາຕໍ່ອາຍຸ',
    type: 'contract',
    href: '/documents/archive',
  },
];

const TASK_META: Record<TaskType, { icon: typeof FileText; iconBox: string }> = {
  approval: { icon: AlertCircle, iconBox: 'bg-amber-50 text-amber-600 ring-amber-100' },
  review: { icon: FileText, iconBox: 'bg-indigo-50 text-indigo-600 ring-indigo-100' },
  contract: { icon: FileCheck2, iconBox: 'bg-rose-50 text-rose-600 ring-rose-100' },
  meeting: { icon: Video, iconBox: 'bg-violet-50 text-violet-600 ring-violet-100' },
  call: { icon: Phone, iconBox: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
};

export function SchedulePanel() {
  const { documents } = useDocuments();
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()));

  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }, []);

  const active = useMemo(() => documents.filter((d) => !d.deleted), [documents]);

  const tasks = useMemo<Task[]>(() => {
    const pendingDocs = active
      .filter((d) => d.status === 'pending')
      .sort((a, b) => (a.uploadDate < b.uploadDate ? -1 : 1))
      .slice(0, APPROVAL_TIMES.length);

    const approvalTasks: Task[] = pendingDocs.map((doc, i) => ({
      id: `approval-${doc.id}`,
      time: APPROVAL_TIMES[i] ?? '11:30',
      title: `ອະນຸມັດ: ${doc.title}`,
      detail: `${doc.docNumber || '—'} · ອັບໂຫຼດໂດຍ ${doc.uploadedBy || '—'}`,
      type: 'approval',
      href: '/documents/pending',
    }));

    return [...approvalTasks, ...STATIC_TASKS]
      .sort((a, b) => (a.time < b.time ? -1 : 1))
      .slice(0, 7);
  }, [active]);

  const pendingUrgent = active.filter((d) => d.status === 'pending').length;
  const selectedDate = parseDateKey(selectedKey);

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const isDone = (time: string): boolean => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m < nowMinutes;
  };

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      {/* Panel header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">ກຳນົດເວລາ & ເອກະສານດ່ວນ</h2>
          {pendingUrgent > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {pendingUrgent} ດ່ວນ
            </span>
          )}
        </div>
        <Link
          href="/documents/upload"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200/60 transition-all hover:bg-indigo-500"
        >
          <Plus className="h-3.5 w-3.5" />
          ອັບໂຫຼດເອກະສານ
        </Link>
      </div>

      {/* Horizontal date picker strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {days.map((d) => {
          const key = toDateKey(d);
          const isSelected = selectedKey === key;
          const isToday = key === toDateKey(new Date());
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              aria-pressed={isSelected}
              className={`flex min-w-[58px] flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 transition-all duration-300 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50'
              }`}
            >
              <span className={`text-[11px] font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                {LAO_DAYS_SHORT[d.getDay()]}
              </span>
              <span className="text-base font-bold leading-none">{d.getDate()}</span>
              <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : isToday ? 'bg-indigo-500' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
{/* Selected date label */}
      <p className="mt-4 text-xs font-medium text-slate-400">
        {selectedDate ? formatFullDateLao(selectedDate) : 'ກຳລັງໂຫຼດວັນທີ...'}
      </p>

      {/* Vertical timeline */}
      <ol className="relative mt-3 space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-100">
        {tasks.map((task) => {
          const meta = TASK_META[task.type];
          const Icon = meta.icon;
          const done = isDone(task.time);
          return (
            <li key={task.id} className="group relative pl-12">
              <span
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${meta.iconBox} ${done ? 'opacity-60' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <Link
                href={task.href}
                className={`block rounded-2xl border border-slate-100 bg-white p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm ${
                  done ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-600">{task.time}</span>
                  {done && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> ສຳເລັດ
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-slate-800">{task.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{task.detail}</p>
              </Link>
            </li>
          );
        })}

        {tasks.length === 0 && (
          <li className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            ບໍ່ມີລາຍການໃນມື້ນີ້
          </li>
        )}
      </ol>

      <Link
        href="/reports"
        className="mt-5 flex items-center justify-center gap-1 rounded-2xl bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
      >
        ເບິ່ງກຳນົດເວລາທັງໝົດ
      </Link>
    </section>
  );
}