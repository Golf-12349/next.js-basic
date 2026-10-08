'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRightLeft,
  BarChart3,
  Bell,
  BellOff,
  Bookmark,
  Briefcase,
  Building2,
  CalendarX,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  FileText,
  FolderArchive,
  History,
  LayoutDashboard,
  Layers,
  Library,
  LogOut,
  Menu,
  PackageOpen,
  Search,
  Settings,
  ShieldCheck,
  Tag,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useDocuments } from '../(main)/context/DocumentsContext';
import { useNotifications } from '../(main)/context/NotificationsContext';
import apiClient from '@/config/axiosClient';
import { useCurrentUser } from '../(main)/context/CurrentUserContext';
import { roleLabel } from '@/types/user';
import { fetchIncomingTransfers } from '@/lib/dms/documentService';
import { BrandLogo } from './brand-logo';
import { UserAvatar } from './users/UserModals';

type DashboardLayoutProps = {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
};

type SubMenuItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  roles?: ('SuperAdmin' | 'DivisionAdmin' | 'DepartmentAdmin')[];
};

type MenuItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  roles?: ('SuperAdmin' | 'DivisionAdmin' | 'DepartmentAdmin')[];
  children?: SubMenuItem[];
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type NotificationType =
  | 'pending'
  | 'approved'
  | 'user'
  | 'alert'
  | 'transfer_pending'
  | 'transfer_approved'
  | 'transfer_rejected'
  | 'expired';

function formatNotifTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'ມື້ນີ້';
  if (days === 1) return '1 ມື້ກ່ອນ';
  return `${days} ມື້ກ່ອນ`;
}

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
      { name: 'ເອກະສານທັງໝົດ', href: '/documents', icon: FileText },
      {
        name: 'ຄັງເກັບເອກະສານ',
        href: '/documents/archive',
        icon: Archive,
        children: [
          {
            name: 'ຄັງເອກະສານ',
            href: '/documents/archive?level=warehouses',
            icon: Building2,
            roles: ['SuperAdmin', 'DivisionAdmin'],
          },
          {
            name: 'ຕູ້ເອກະສານ',
            href: '/documents/archive?level=cabinets',
            icon: Layers,
          },
          {
            name: 'ຊັ້ນວາງເອກະສານ',
            href: '/documents/archive?level=shelves',
            icon: Library,
          },
          {
            name: 'ແຟ້ມເກັບເອກະສານ',
            href: '/documents/archive?level=folders',
            icon: FolderArchive,
          },
        ],
      },
      { name: 'ຍັງບໍ່ມີບ່ອນເກັບ', href: '/documents/unassigned', icon: PackageOpen },
      { name: 'ປະຫວັດການອັບໂຫຼດ', href: '/documents/upload-history', icon: History },
      { name: 'ເອກະສານສົ່ງຂ້າມ', href: '/documents/pending', icon: ArrowRightLeft },
      { name: 'ປະຫວັດການສົ່ງຂ້າມ', href: '/documents/transfers', icon: ArrowRightLeft },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        name: 'ຂໍ້ມູນພື້ນຖານ',
        href: '/master-data',
        icon: Database,
        roles: ['SuperAdmin'],
        children: [
          { name: 'ປະເພດເອກະສານ', href: '/master-data/categories', icon: Tag },
          { name: 'ຈັດການຝ່າຍ', href: '/master-data/divisions', icon: Building2 },
          { name: 'ຈັດການພະແນກ', href: '/master-data/departments', icon: Layers },
          { name: 'ອາຍຸການເກັບຮັກສາ', href: '/master-data/retention', icon: Clock },
          { name: 'ປ້າຍກຳກັບ / ແທັກ', href: '/master-data/tags', icon: Bookmark },
          { name: 'ຈັດການຕຳແໜ່ງ', href: '/master-data/positions', icon: Briefcase },
        ],
      },
      { name: 'ຈັດການຜູ້ໃຊ້ງານ', href: '/users', icon: Users },
      { name: 'ເອກະສານໝົດອາຍຸ', href: '/documents/expired', icon: CalendarX },
      {
        name: 'ຖັງຂີ້ເຫຍື້ອ',
        href: '/documents/trash',
        icon: Trash2,
        roles: ['SuperAdmin', 'DivisionAdmin'],
      },
      {
        name: 'ບັນທຶກຄວາມປອດໄພ',
        href: '/audit-logs',
        icon: ShieldCheck,
        roles: ['SuperAdmin'],
      },
    ],
  },
];

export function DashboardLayout({ children, title = 'Dashboard', showSearch }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser, clearUser } = useCurrentUser();
  const { documents } = useDocuments();
  const [incomingTransferCount, setIncomingTransferCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    fetchIncomingTransfers()
      .then((list) => {
        if (active && Array.isArray(list)) setIncomingTransferCount(list.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  // eslint-disable-next-line react-hooks/purity -- sidebar expiry window derived from the current date
  const in7DaysStr = useMemo(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), []);

  const expiredCount = useMemo(() => {
    return documents.filter(
      (d) => !d.deleted && (d.status === 'expired' || (Boolean(d.expiresAt) && d.expiresAt! <= todayStr))
    ).length;
  }, [documents, todayStr]);

  const expiringSoonCount = useMemo(() => {
    return documents.filter(
      (d) =>
        !d.deleted &&
        d.status !== 'expired' &&
        Boolean(d.expiresAt) &&
        d.expiresAt! > todayStr &&
        d.expiresAt! <= in7DaysStr
    ).length;
  }, [documents, todayStr, in7DaysStr]);

  const unassignedCount = useMemo(() => {
    return documents.filter((d) => !d.deleted && !d.cabinetId && !d.folderId).length;
  }, [documents]);

  // Routes where the global header search is visible (only /documents and /documents/unassigned)
  const searchAllowedRoutes = ['/documents', '/documents/unassigned'];
  const shouldShowSearch = showSearch !== undefined ? showSearch : searchAllowedRoutes.includes(pathname);

  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/documents/archive': true,
  });
  const [, setCurrentQuery] = useState('');
  const [activeArchiveLevel, setActiveArchiveLevel] = useState<string>('warehouses');

  // ── Responsive shell: ຈໍນ້ອຍ (ມືຖື/ແທັບເລັດ) ໃຊ້ off-canvas drawer ສຳລັບເມນູ ──
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // ປິດ drawer / ຊ່ອງຄົ້ນຫາມືຖື ອັດຕະໂນມັດເມື່ອປ່ຽນໜ້າ
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile overlays after navigation
    setMobileNavOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  // ລັອກການເລື່ອນຂອງ body ຕອນ drawer ເປີດ (ກັນໜ້າຫຼັງເລື່ອນຕາມ)
  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  // ກົດ Esc ເພື່ອປິດ drawer
  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  // ປິດ drawer ອັດຕະໂນມັດເມື່ອປ່ຽນໄປຈໍໃຫຍ່ (≥ lg) — ກັນບໍ່ໃຫ້ body ຄ້າງສະຖານະລັອກສະຄຣອນ
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileNavOpen(false);
    };
    desktopQuery.addEventListener('change', handleDesktopChange);
    return () => desktopQuery.removeEventListener('change', handleDesktopChange);
  }, []);

  useEffect(() => {
    const handleLevelChanged = (e: Event) => {
      const custom = e as CustomEvent<{ level: string }>;
      if (custom.detail?.level) {
        setActiveArchiveLevel(custom.detail.level);
      }
    };

    window.addEventListener('dms:archive-level-changed', handleLevelChanged);
    return () => window.removeEventListener('dms:archive-level-changed', handleLevelChanged);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lvl = params.get('level');
      if (lvl) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect the archive level from the URL query string
        setActiveArchiveLevel(lvl);
      } else if (pathname === '/documents/archive') {
        setActiveArchiveLevel(currentUser?.role === 'DepartmentAdmin' ? 'cabinets' : 'warehouses');
      }
    }
  }, [pathname, currentUser]);

  useEffect(() => {
    const updateQuery = () => {
      if (typeof window !== 'undefined') {
        setCurrentQuery(window.location.search);
      }
    };
    updateQuery();
    window.addEventListener('popstate', updateQuery);
    return () => window.removeEventListener('popstate', updateQuery);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/documents/archive')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-expand the archive submenu when on an archive route
      setExpandedMenus((prev) => ({ ...prev, '/documents/archive': true }));
    }
  }, [pathname]);

  const toggleExpand = (href: string) => {
    setExpandedMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  // ດຶງການແຈ້ງເຕືອນຈິງຈາກ backend (persist ໃນຖານຂໍ້ມູນ ບໍ່ຜູກກັບ sessionStorage/ເຄື່ອງໃດເຄື່ອງໜຶ່ງອີກຕໍ່ໄປ)
  const { notifications: apiNotifications, unreadCount, markRead, markAllRead } = useNotifications();

  const notifications = useMemo(
    () =>
      apiNotifications.map((n) => {
        let title = n.title;
        if (title === 'เอกสารของคุณได้รับการอนุมัติแล้ว') {
          title = 'ເອກະສານຂອງທ່ານໄດ້ຮັບການອະນຸມັດແລ້ວ';
        } else if (title === 'มีเอกสารรอตรวจใหม่') {
          title = 'ມີເອກະສານລໍຖ້າກວດສອບໃໝ່';
        }
        return {
          id: n.id,
          title,
          detail: n.detail ?? '',
          time: formatNotifTime(n.createdAt),
          link: n.link ?? '/documents',
          read: n.read,
          type: n.type,
        };
      }),
    [apiNotifications],
  );

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

  async function handleLogout() {
    // best-effort — ต้อง revoke token ฝั่ง server ด้วย (tokenVersion) ไม่ใช่แค่ลบ storage เฉยๆ
    // ถ้า request ล้มเหลว (เช่น network ขาด) ก็ยังต้องเคลียร์ storage แล้ว logout ต่อไปได้ปกติ
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore — เคลียร์ session ต่อไปแม้ revoke ฝั่ง server ไม่สำเร็จ
    }
    clearUser();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('data');
    localStorage.removeItem('token');
    localStorage.removeItem('data');
    window.location.replace('/');
  }

  function handleMarkAllAsRead() {
    void markAllRead();
  }

  function handleNotificationClick(item: (typeof notifications)[number]) {
    void markRead(item.id);
    setNotifOpen(false);
    router.push(item.link);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/documents?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/documents');
    }
  }

  function getNotificationIcon(type: NotificationType) {
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
      case 'alert':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        );
      case 'user':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <UserPlus className="h-4 w-4" />
          </div>
        );
      case 'transfer_pending':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Layers className="h-4 w-4" />
          </div>
        );
      case 'transfer_approved':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'transfer_rejected':
      case 'expired':
        return (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        );
    }
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-gray-50 font-sans text-gray-800">
      {/* Backdrop ມືຖື — ແຕະເພື່ອປິດ drawer */}
      <div
        aria-hidden={!mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar — ຈໍໃຫຍ່ (lg+) ສະແດງຄົງທີ່ · ຈໍນ້ອຍ ເປັນ drawer ເລື່ອນເຂົ້າ-ອອກ */}
      <aside
        className={`no-scrollbar fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col justify-between overscroll-contain overflow-y-auto bg-slate-950 p-4 text-slate-100 shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-800 px-2 pb-4">
            <BrandLogo variant="dark" subtitle="ລະບົບເອກກະສານ" />
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="ປິດເມນູ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-4">
            {menuSections
              .map((section) => ({
                ...section,
                items: section.items.filter((item) => {
                  const userRole = currentUser?.role ?? 'DepartmentAdmin';
                  if (item.roles && !item.roles.includes(userRole)) {
                    return false;
                  }
                  const isAdmin = currentUser?.role === 'DivisionAdmin' || currentUser?.role === 'SuperAdmin';
                  if (item.href === '/users' && !isAdmin) {
                    return false;
                  }
                  return true;
                }),
              }))
              .filter((section) => section.items.length > 0)
              .map((section) => (
                <div key={section.title}>
                  <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {section.title === 'MAIN' ? 'ເມນູຫຼັກ' : section.title === 'DOCUMENTS' ? 'ຈັດການເອກກະສານ' : 'ລະບົບ & ການຕັ້ງຄ່າ'}
                  </div>

                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const hasChildren = !!(item.children && item.children.length > 0);
                      const isExpanded = !!expandedMenus[item.href];
                      const isParentActive =
                        pathname === item.href ||
                        (item.href === '/dashboard' && pathname === '/') ||
                        (hasChildren && pathname.startsWith(item.href));
                      let itemBadge: string | undefined = item.badge;
                      let badgeClass = 'bg-amber-400 text-slate-900';

                      if (item.href === '/documents/pending' && incomingTransferCount > 0) {
                        itemBadge = String(incomingTransferCount);
                        badgeClass = 'bg-indigo-600 text-white font-bold shadow-sm';
                      } else if (item.href === '/documents/unassigned' && unassignedCount > 0) {
                        itemBadge = String(unassignedCount);
                        badgeClass = 'bg-amber-500 text-slate-950 font-bold shadow-sm';
                      } else if (item.href === '/documents/expired') {
                        if (expiredCount > 0) {
                          itemBadge = String(expiredCount);
                          badgeClass = 'bg-rose-500 text-white font-extrabold shadow-sm shadow-rose-900/50';
                        } else if (expiringSoonCount > 0) {
                          itemBadge = `${expiringSoonCount} ໃກ້ໝົດ`;
                          badgeClass = 'bg-amber-500 text-white font-medium';
                        }
                      }

                      const userRole = currentUser?.role ?? 'DepartmentAdmin';
                      const allowedChildren = hasChildren
                        ? item.children!.filter((child) => !child.roles || child.roles.includes(userRole))
                        : [];

                      if (hasChildren) {
                        return (
                          <div key={item.name} className="space-y-1">
                            <div
                              onClick={() => toggleExpand(item.href)}
                              className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all select-none ${
                                isParentActive
                                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                              }`}
                            >
                              <Link
                                href={item.href}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMenus((prev) => ({ ...prev, [item.href]: true }));
                                }}
                                className="flex flex-1 items-center gap-3"
                              >
                                <Icon className={`h-4 w-4 shrink-0 ${isParentActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                <span>{item.name}</span>
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(item.href);
                                }}
                                className="p-0.5 text-slate-400 transition-colors hover:text-white"
                                title={isExpanded ? 'ຍຸບເມນູ' : 'ຂະຫຍາຍເມນູ'}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-0' : '-rotate-90'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Collapsible Children Submenu with vertical guide line like in example picture */}
                            {isExpanded && allowedChildren.length > 0 && (
                              <div className="ml-5 space-y-0.5 border-l border-slate-700/60 pl-3 py-1 animate-in fade-in duration-150">
                                {allowedChildren.map((child) => {
                                  const ChildIcon = child.icon;
                                  const childLevel = child.href.includes('level=') ? child.href.split('level=')[1] : '';
                                  const isChildActive =
                                    pathname === '/documents/archive' && activeArchiveLevel === childLevel;

                                  return (
                                    <Link
                                      key={child.name}
                                      href={child.href}
                                      onClick={() => {
                                        setActiveArchiveLevel(childLevel);
                                        window.dispatchEvent(new CustomEvent('dms:set-archive-level', { detail: { level: childLevel } }));
                                        window.dispatchEvent(new CustomEvent('dms:archive-level-changed', { detail: { level: childLevel } }));
                                        setMobileNavOpen(false);
                                      }}
                                      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                                        isChildActive
                                          ? 'bg-indigo-600/25 text-indigo-300 font-semibold shadow-sm'
                                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                      }`}
                                    >
                                      <ChildIcon className={`h-3.5 w-3.5 shrink-0 transition-colors ${isChildActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                      <span className="truncate">{child.name}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                            isParentActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/30'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </span>
                          {itemBadge ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
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
            <UserAvatar
              name={currentUser?.name || 'ຜູ້ໃຊ້ງານ'}
              avatarUrl={currentUser?.avatarUrl}
              avatarClassName="h-10 w-10 bg-indigo-100 text-indigo-700"
              textClassName="text-sm font-bold"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{currentUser?.name || 'ຜູ້ໃຊ້ງານ'}</div>
              <div className="text-xs text-slate-400">{roleLabel(currentUser?.role ?? 'DepartmentAdmin')}</div>
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

      {/* Main content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header — sticky + ແຖວຄົ້ນຫາແຍກສຳລັບມືຖື, ບໍ່ໃຫ້ລົ້ນຂອບຈໍ */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-gray-200/70 bg-white/90 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="-ml-1 shrink-0 rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 active:bg-gray-200 lg:hidden"
              aria-label="ເປີດເມນູນຳທາງ"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <BrandLogo size="sm" variant="light" className="hidden shrink-0 min-[420px]:block" />
              <h1 className="truncate text-sm font-semibold text-gray-800 min-[420px]:text-base sm:text-lg">
                {title}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              {/* ປຸ່ມຄົ້ນຫາມືຖື — ເປີດແຖວຄົ້ນຫາແຖວທີສອງ (ສະແດງເຉພາະຈໍ < sm) */}
              {shouldShowSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen((open) => !open);
                    setNotifOpen(false);
                    setProfileOpen(false);
                  }}
                  className={`rounded-full p-2.5 transition-all sm:hidden ${
                    mobileSearchOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="ຄົ້ນຫາເອກະສານ"
                  aria-expanded={mobileSearchOpen}
                >
                  <Search className="h-5 w-5" />
                </button>
              )}

              {/* Global Search — ເດສກ໌ທັອບ/ແທັບເລັດ (≥ sm) */}
              {shouldShowSearch && (
                <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ຄົ້ນຫາເອກະສານ, ລະຫັດ, ຜູ້ໃຊ້..."
                    aria-label="ຄົ້ນຫາເອກະສານ"
                    className="w-44 rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-8 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 md:w-72 md:text-sm lg:w-80"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="ລຶບຂໍ້ຄວາມຄົ້ນຫາ"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </form>
              )}

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  setProfileOpen(false);
                  setMobileSearchOpen(false);
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

              {/* Notification Dropdown Menu — ກວ້າງເຕັມເກືອບເຕັມຈໍໃນມືຖື, ກັນລົ້ນຂອບຂວາ */}
              <div
                className={`fixed left-3 right-3 top-[60px] z-50 max-h-[calc(100dvh-5rem)] w-auto origin-top-right overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-200 ease-out sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 ${
                  notifOpen
                    ? 'pointer-events-auto scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
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
                      ອ່ານທັງໝົດ
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

            {/* Profile Dropdown — ມືຖືໂຊສະເພາະ avatar, ຊ່ອງຊື່ຊ່ອນເພື່ອປະຢັດພື້ນທີ່ */}
            <div className="relative shrink-0 border-l border-gray-200 pl-1.5 sm:pl-3" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setNotifOpen(false);
                }}
                aria-label="ເມນູຜູ້ໃຊ້ງານ"
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-gray-50 sm:gap-3 sm:px-2"
              >
                <UserAvatar
                  name={currentUser?.name || 'ຜູ້ໃຊ້ງານ'}
                  avatarUrl={currentUser?.avatarUrl}
                  avatarClassName="h-9 w-9 bg-indigo-100 text-indigo-700"
                  textClassName="text-sm font-bold"
                />
                <div className="hidden text-left md:block">
                  <p className="max-w-32 truncate text-sm font-semibold leading-none text-gray-900 lg:max-w-44">{currentUser?.name || 'ຜູ້ໃຊ້ງານ'}</p>
                  <p className="mt-1 text-xs text-gray-500">{roleLabel(currentUser?.role ?? 'DepartmentAdmin')}</p>
                </div>
                <ChevronDown
                  className={`hidden h-4 w-4 text-gray-400 transition-transform duration-300 sm:block ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`fixed right-4 top-[60px] z-50 w-64 max-w-[calc(100vw-2rem)] origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-200 ease-out sm:absolute sm:right-0 sm:top-full sm:mt-2 ${
                  profileOpen
                    ? 'pointer-events-auto scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                }`}
              >
                {/* User header */}
                <div className="border-b border-gray-100 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={currentUser?.name || 'ຜູ້ໃຊ້ງານ'}
                      avatarUrl={currentUser?.avatarUrl}
                      avatarClassName="h-10 w-10 bg-indigo-100 text-indigo-700"
                      textClassName="text-sm font-bold"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{currentUser?.name || 'ຜູ້ໃຊ້ງານ'}</p>
                      <p className="text-xs text-gray-500">{roleLabel(currentUser?.role ?? 'DepartmentAdmin')}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <UserCog className="h-4 w-4 text-gray-400" />
                    ແກ້ໄຂໂປຣໄຟລ໌
                  </button>
                  {(currentUser?.role === 'SuperAdmin' || currentUser?.role === 'DivisionAdmin') && (
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
                  )}
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
          </div>

          {/* ແຖວຄົ້ນຫາມືຖືແຖວທີສອງ — ຂະຫຍາຍລົງໃຕ້ header ເມື່ອກົດປຸ່ມແວ່ນຂະຫຍາຍ (ຈໍ < sm) */}
          {shouldShowSearch && mobileSearchOpen && (
            <div className="border-t border-gray-100 px-3 pb-3 pt-2 sm:hidden">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ຄົ້ນຫາເອກະສານ, ລະຫັດ, ຜູ້ໃຊ້..."
                  aria-label="ຄົ້ນຫາເອກະສານ"
                  enterKeyHint="search"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="ລຶບຂໍ້ຄວາມຄົ້ນຫາ"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </form>
            </div>
          )}
        </header>

        <main className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
