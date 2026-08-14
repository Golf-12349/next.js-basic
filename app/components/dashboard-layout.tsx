'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Archive,
  BarChart3,
  Bell,
  Clock3,
  FileText,
  FolderOpen,
  FolderTree,
  Inbox,
  LayoutDashboard,
  LogOut,
  Search,
  Send,
  Settings,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';

type DashboardLayoutProps = {
  children: ReactNode;
  title?: string;
};

type MenuItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    title: 'MAIN',
    items: [
      { name: 'ໜ້າຫຼັກ', href: '/dashboard', icon: LayoutDashboard },
      { name: 'ລາຍງານ & ສະຖິຕິ', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      { name: 'ເອກກະສານທັງໝົດ', href: '/documents', icon: FileText },
      { name: 'ເອກກະສານຂາເຂົ້າ', href: '/documents/inbound', icon: Inbox },
      { name: 'ເອກກະສານຂາອອກ', href: '/documents/outbound', icon: Send },
      { name: 'ລໍຖ້າອະນຸມັດ', href: '/documents/pending', icon: Clock3, badge: '3' },
      { name: 'ອັບໂຫຼດເອກກະສານ', href: '/documents/upload', icon: Upload },
      { name: 'ໝວດໝູ່ເອກກະສານ', href: '/categories', icon: FolderTree },
      { name: 'ຄັງເກັບເອກກະສານ', href: '/documents/archive', icon: Archive },
    ],
  },
      {
        title: 'SYSTEM',
        items: [
          { name: 'ຈັດການຜູ້ໃຊ້ງານ', href: '/users', icon: Users },
          { name: 'ຖັງຂີ້ເຫຍື້ອ', href: '/documents/trash', icon: Trash2 },
          { name: 'ການຕັ້ງຄ່າ', href: '/settings', icon: Settings },
        ],
      },
];

export function DashboardLayout({ children, title = 'Dashboard' }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div
      className="flex h-screen bg-gray-50 text-gray-800"
      style={{ fontFamily: "'Noto Sans Lao', 'Noto Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Lao:wght@400;500;600;700&display=swap');
      `}</style>

      <aside className="flex w-72 flex-col justify-between overflow-y-auto bg-slate-950 p-4 text-slate-100 shadow-2xl">
        <div>
          <div className="mb-6 flex items-center gap-3 border-b border-slate-800 px-2 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/40">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">DMS</div>
              <div className="text-sm font-semibold text-white">ລະບົບເອກກະສານ</div>
            </div>
          </div>

          <nav className="space-y-5">
            {menuSections.map((section) => (
              <div key={section.title}>
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {section.title === 'MAIN' ? 'ເມນູຫຼັກ' : section.title === 'DOCUMENTS' ? 'ຈັດການເອກກະສານ' : 'ລະບົບ & ການຕັ້ງຄ່າ'}
                </div>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </span>
                        {item.badge ? (
                          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-900/80 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              JD
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">John Doe</div>
              <div className="text-xs text-slate-400">ຜູ້ບໍລິຫານລະບົບ</div>
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            ອອກຈາກລະບົບ
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ຄົ້ນຫາ..."
              className="w-full rounded-lg border border-transparent bg-gray-100 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                JD
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-none">John Doe</p>
                <p className="mt-1 text-xs text-gray-500">ຜູ້ບໍລິຫານລະບົບ</p>
              </div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
