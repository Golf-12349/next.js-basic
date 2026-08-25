'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import secureLocalStorage from 'react-secure-storage';
import {
  Archive,
  BarChart3,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Clock3,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Trash2,
  Upload,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { useDMS } from '../(main)/_dms-context';

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

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  link: string;
  read: boolean;
  type: 'pending' | 'approved' | 'user';
};

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'ເອກະສານໃໝ່ລໍຖ້າອະນຸມັດ',
    detail: 'Doc: K-2026-001',
    time: '2 ນາທີກ່ອນ',
    link: '/documents/pending',
    read: false,
    type: 'pending',
  },
  {
    id: 'notif-2',
    title: 'ເອກະສານຖືກອະນຸມັດແລ້ວ',
    detail: 'Doc: CT-2026-021',
    time: '10 ນາທີກ່ອນ',
    link: '/documents',
    read: false,
    type: 'approved',
  },
  {
    id: 'notif-3',
    title: 'ເພີ່ມຜູ້ໃຊ້ງານໃໝ່',
    detail: 'User: ທ້າວ ອາລີ',
    time: '1 ຊົ່ວໂມງກ່ອນ',
    link: '/users',
    read: false,
    type: 'user',
  },
];

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
      { name: 'ລໍຖ້າອະນຸມັດ', href: '/documents/pending', icon: Clock3 },
      { name: 'ອັບໂຫຼດເອກກະສານ', href: '/documents/upload', icon: Upload },
      { name: 'ຄັງເກັບເອກກະສານ', href: '/documents/archive', icon: Archive },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'ຈັດການຜູ້ໃຊ້ງານ', href: '/users', icon: Users },
      { name: 'ຖັງຂີ້ເຫຍື້ອ', href: '/documents/trash', icon: Trash2 },
    ],
  },
];

export function DashboardLayout({ children, title = 'Dashboard' }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { documents } = useDMS();
  const pendingCount = documents.filter((d) => d.status === 'pending' && !d.deleted).length;

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [userName, setUserName] = useState('John Doe');
  const [userRole, setUserRole] = useState('ຜູ້ບໍລິຫານລະບົບ');

  useEffect(() => {
    try {
      const stored = secureLocalStorage.getItem('data');
      if (stored && typeof stored === 'object') {
        const parsed = stored as { name?: string; role?: string };
        if (parsed.name) setUserName(parsed.name);
        if (parsed.role) setUserRole(parsed.role === 'Admin' || parsed.role === 'SuperAdmin' ? 'ຜູ້ບໍລິຫານລະບົບ' : parsed.role);
      }
    } catch {
      // fallback to default
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    secureLocalStorage.removeItem('token');
    secureLocalStorage.removeItem('data');
    router.push('/');
  }

  function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function handleNotificationClick(item: NotificationItem) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setNotifOpen(false);
    router.push(item.link);
  }

  function getNotificationIcon(type: NotificationItem['type']) {
    switch (type) {
      case 'pending':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <FileText className="h-4 w-4" />
          </div>
        );
      case 'approved':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'user':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <UserPlus className="h-4 w-4" />
          </div>
        );
    }
  }

  const userInitials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'JD';

  return (
    <div
      className="flex h-screen bg-gray-50 text-gray-800"
      style={{ fontFamily: "'Noto Sans Lao', 'Noto Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Lao:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Sidebar */}
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
                    const itemBadge = item.href === '/documents/pending' && pendingCount > 0 ? String(pendingCount) : item.badge;

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
                        {itemBadge ? (
                          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                            {itemBadge}
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
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{userName}</div>
              <div className="text-xs text-slate-400">{userRole}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            ອອກຈາກລະບົບ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                className={`relative rounded-full p-2.5 text-gray-600 transition-all ${
                  notifOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100'
                }`}
                aria-label="ການແຈ້ງເຕືອນ"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              <div
                className={`absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out ${
                  notifOpen
                    ? 'pointer-events-auto scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">ການແຈ້ງເຕືອນ</span>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">
                        {unreadCount} ໃໝ່
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        ອ່ານແລ້ວທັງໝົດ
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      ໝາຍວ່າອ່ານແລ້ວທັງໝົດ
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[380px] divide-y divide-gray-100 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <BellOff className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-600">ບໍ່ມີການແຈ້ງເຕືອນ</p>
                      <p className="mt-0.5 text-xs text-gray-400">ທ່ານຈະໄດ້ຮັບການແຈ້ງເຕືອນເມື່ອມີເອກະສານໃໝ່</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className={`flex w-full items-start gap-3.5 p-3.5 text-left transition-colors hover:bg-gray-50 ${
                          !item.read ? 'bg-indigo-50/40' : 'bg-white'
                        }`}
                      >
                        {getNotificationIcon(item.type)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium ${!item.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {item.title}
                            </p>
                            {!item.read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500"></span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">{item.detail}</p>
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        router.push('/documents/pending');
                      }}
                      className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                    >
                      ເບິ່ງເອກະສານລໍຖ້າອະນຸມັດທັງໝົດ →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative border-l border-gray-200 pl-3" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {userInitials}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold leading-none text-gray-900">{userName}</p>
                  <p className="mt-1 text-xs text-gray-500">{userRole}</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-200 ease-out ${
                  profileOpen
                    ? 'pointer-events-auto scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                }`}
              >
                {/* User header */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{userRole}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/settings');
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <UserCog className="h-4 w-4 text-gray-400" />
                    ແກ້ໄຂໂປຣໄຟລ໌
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/settings');
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    ຕັ້ງຄ່າລະບົບ
                  </button>
                </div>

                <div className="mx-3 my-1 border-t border-gray-100" />

                {/* Logout */}
                <div className="p-1.5 pb-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    ອອກຈາກລະບົບ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}