export type UserRole = 'SuperAdmin' | 'Admin' | 'User' | 'Staff';

export type UserStatus = 'active' | 'inactive';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  division?: string; // ຝ່າຍ / ຫ້ອງການ / ສະຖາບັນ
  department: string; // ພະແນກ / ສູນ
  status: UserStatus;
  joinDate: string;
  lastActive?: string;
  avatarUrl?: string; // ຮູບພາບ ຫຼື ສີ avatar (URL / data URL / ລະຫັດສີ #hex)
  password?: string; // ລະຫັດຜ່ານ (ໃຊ້ຕອນສ້າງຜູ້ໃຊ້ໃໝ່)
};

/**
 * ຂໍ້ມູນຜູ້ໃຊ້ງານທີ່ເຂົ້າລະບົບ (authenticated user) — Single Source of Truth.
 * Sidebar, Header, Settings Page, User Management ທັງໝົດ ໃຊ້ຂໍ້ມູນນີ້.
 */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  division?: string;
  position?: string;
  status: UserStatus;
  avatarUrl?: string;
};

/**
 * ຮູບແບບຂໍ້ມູນທີ່ backend ສົ່ງມາ (login / /auth/me / /users/me) —
 * field ສາມາດແຕກຕ່າງກັນ: phone/phoneNumber, avatar/avatarUrl,
 * role/department ເປັນ string ຫຼື object ກໍໄດ້.
 */
export type RawUser = Record<string, unknown>;

function pickText(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const text = value.trim();
    return text.length > 0 ? text : undefined;
  }
  if (typeof value === 'object') {
    const name = (value as Record<string, unknown>).name;
    if (typeof name === 'string') {
      const text = name.trim();
      return text.length > 0 ? text : undefined;
    }
  }
  return undefined;
}

function pickRole(value: unknown): UserRole {
  const raw = pickText(value);
  const normalized = raw?.toLowerCase().replace(/[-\s_]/g, '');
  if (normalized === 'superadmin') return 'SuperAdmin';
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'staff') return 'Staff';
  return 'User';
}

function pickStatus(value: unknown): UserStatus {
  const raw = pickText(value);
  return raw && raw.toLowerCase().trim() === 'inactive' ? 'inactive' : 'active';
}

/** ປ່ຽນຂໍ້ມູນທີ່ backend ສົ່ງມາ (login / /auth/me / /users/me) ເປັນ CurrentUser ຄື. */
export function normalizeAuthUser(raw: unknown): CurrentUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = pickText(r.id) ?? pickText(r.userId) ?? pickText(r._id);
  if (!id) return null;
  return {
    id,
    name: pickText(r.name) ?? pickText(r.username) ?? '',
    email: pickText(r.email) ?? '',
    phone: pickText(r.phone) ?? pickText(r.phoneNumber) ?? pickText(r.phone_number),
    role: pickRole(r.role),
    department: pickText(r.department) ?? pickText(r.departmentName),
    division: pickText(r.division) ?? pickText(r.divisionName),
    position: pickText(r.position) ?? pickText(r.positionName),
    status: pickStatus(r.status),
    avatarUrl: pickText(r.avatarUrl) ?? pickText(r.avatar) ?? pickText(r.avatar_url) ?? pickText(r.photoUrl),
  };
}

/** ປ່ຽນຂໍ້ມູນຈາກ storage / ການ merge ເປັນ CurrentUser ຄື (guarantee fields ຄົບຖ້ວນ). */
export function normalizeCurrentUser(value: unknown): CurrentUser | null {
  const normalized = normalizeAuthUser(value);
  if (normalized) return normalized;
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<CurrentUser>;
  if (!v.id) return null;
  return {
    id: v.id,
    name: v.name ?? '',
    email: v.email ?? '',
    phone: v.phone,
    role: v.role ?? 'User',
    department: v.department,
    division: v.division,
    position: v.position,
    status: v.status ?? 'active',
    avatarUrl: v.avatarUrl,
  };
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'SuperAdmin':
      return 'ຜູ້ດູແລລະບົບສູງສຸດ';
    case 'Admin':
      return 'ຜູ້ດູແລລະບົບ';
    case 'Staff':
      return 'ພະນັກງານ';
    default:
      return 'ຜູ້ໃຊ້ງານ';
  }
}

export function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem('data') || localStorage.getItem('data');
    if (!stored) return null;
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
    return normalizeCurrentUser(parsed);
  } catch {
    return null;
  }
}

/**
 * ໂຄງສ້າງການຈັດຕັ້ງ EDL (11 ຝ່າຍ/ຫ້ອງການ/ສະຖາບັນ ພ້ອມ ພະແນກ/ສູນ)
 */
export const edlStructure: Record<string, string[]> = {
  'ຫ້ອງການໄຟຟ້າລາວ': [
    'ພະແນກຄົ້ນຄ້ວາ-ສັງລວມ',
    'ພະແນກເລຂາ-ບໍລິຫານຫ້ອງການ',
    'ພະແນກພົວພັນ ແລະ ຮ່ວມມື',
    'ພະແນກປະຊາສໍາພັນ ແລະ ກິດຈະກໍາເພື່ອສັງຄົມ',
    'ພະແນກສະໜັບສະໜູນ',
    'ພະແນກຄຸ້ມຄອງຊັບສິນ ແລະ ວັດສະດຸສ້າງ',
    'ພະແນກຈັດຊື້-ຈັດຈ້າງ',
    'ພະແນກຄັງເງິນ',
    'ສູນບັນຊາ Call center 1199',
  ],
  'ຝ່າຍກວດກາ': [
    'ພະແນກສະໜັບສະໜູນວຽກງານກວດກາ ແລະ ບໍລິຫານ',
    'ພະແນກກວດສອບລະບົບບໍລິຫານ-ຈັດການ',
    'ພະແນກກວດສອບບັນຊີ-ການເງິນ',
    'ພະແນກກວດກາການດ້ານສໍ້ລາດບັງຫຼວງ',
  ],
  'ຝ່າຍບຸກຄະລາກອນ': [
    'ພະແນກບໍລິຫານ-ສັງລວມ',
    'ພະແນກພັກ ແລະ ອົງການຈັດຕັ້ງມະຫາຊົນ',
    'ພະແນກຄຸ້ມຄອງບໍລິຫານບຸກຄະລາກອນ',
    'ພະແນກວາງແຜນ ແລະ ພັດທະນາບຸກຄະລາກອນ',
    'ພະແນກຄຸ້ມຄອງຂໍ້ມູນບຸກຄະລາກອນ',
    'ພະແນກຄຸ້ມຄອງ ແລະ ບໍລິຫານວິຊາການ',
  ],
  'ຝ່າຍກົດໝາຍ-ສັນຍາ': [
    'ພະແນກບໍລິຫານ-ສັງລວມ',
    'ພະແນກສັນຍາທົ່ວໄປ',
    'ພະແນກສັນຍາຊື້-ຂາຍໄຟຟ້າ',
    'ພະແນກສັນຍາເງິນກູ້',
    'ພະແນກນິຕິກໍາ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
  ],
  'ຝ່າຍບັນຊີ': [
    'ພະແນກບໍລິຫານ-ສັງລວມ',
    'ພະແນກບັນຊີຊັບສິນ',
    'ພະແນກບັນຊີໜີ້ສິນ',
    'ພະແນກບັນຊີລວມ',
  ],
  'ຝ່າຍທຸລະກິດ ແລະ ແຜນການ': [
    'ພະແນກບໍລິຫານ-ສັງລວມ',
    'ພະແນກແຜນການ',
    'ພະແນກຄຸ້ມຄອງການລົງທຶນ ແລະ ທຸລະກິດປິ່ນອ້ອມ',
    'ພະແນກຄຸ້ມຄອງໜີ້ສິນ',
  ],
  'ຝ່າຍເຕັກໂນໂລຊີ ການສື່ສານ ຂໍ້ມູນຂ່າວສານ': [
    'ພະແນກບໍລິຫານ-ສັງລວມ',
    'ພະແນກພັດທະນາ-ຄຸ້ມຄອງຊອບແວ',
    'ພະແນກຄຸ້ມຄອງສູນຂໍ້ມູນ-ລະບົບຄອມພິວເຕີ',
    'ພະແນກຄຸ້ມຄອງລະບົບເຄືອຂ່າຍ',
    'ພະແນກຄຸ້ມຄອງໜ້າເວັບໄຊ ເວັບສະໄຊ-ລະບົບໂນນ',
    'ພະແນກຄຸ້ມຄອງລະບົບສື່ສານ',
  ],
  'ຝ່າຍວາງແຜນ ແລະ ບັນຊາລະບົບໄຟຟ້າ': [
    'ພະແນກບໍລິຫານ-ສັງລວມ',
    'ພະແນກຫຼຸດຜ່ອນພະລັງງານຕົກຮົ່ວ ແລະ DSM',
    'ພະແນກວາງແຜນລະບົບໄຟຟ້າ',
    'ສູນບັນຊາລະບົບໄຟຟ້າແຫ່ງຊາດ',
    'ພະແນກຢັ້ງຢືນຊື້-ຂາຍໄຟຟ້າ',
    'ພະແນກລະບົບປ້ອງກັນໄຟຟ້າ',
  ],
  'ຝ່າຍຄຸ້ມຄອງລະບົບໄຟຟ້າ ພາກເໜືອ': [
    'ພະແນກບໍລິຫານ-ສັງລວມ',
    'ພະແນກກວດກາ',
  ],
  'ສະຖາບັນໄຟຟ້າລາວ': [
    'ພະແນກບໍລິຫານ ແລະ ລະບົບການຈັດການ',
    'ສູນຝຶກອົບຮົມ',
    'ສູນວິໄຈ-ພັດທະນາເຕັກໂນໂລຊີ ແລະ ຄົ້ນຄ້ວານະວັດຕະກໍາໃຫມ່',
    'ສູນທົດສອບອຸປະກອນ ແລະ ມາດຕະຖານເຕັກນິກ',
    'ສູນວິສະວະກໍາອອກແບບ ແລະ ກໍານົດລາຄາກາງ',
    'ສູນກວດກາ-ທົດສອບລະບົບປ້ອງກັນ',
    'ພະແນກເຕັກນິກຄວາມປອດໄພ ແລະ ຄຸ້ມຄອງຄຸນນະພາບ',
    'ສູນຢັ້ງຢືນວຸດທິວິຊາຊີບ ແລະ ຊ່ຽວຊານ',
  ],
  'ຄະນະຄຸ້ມຄອງໂຄງການ': [
    'ພະແນກຄຸ້ມຄອງໂຄງການ',
    'ພະແນກສິ່ງແວດລ້ອມໂຄງການ',
    'ພະແນກບໍາລຸງຮັກສາ ສາຍສົ່ງ, ສະຖານີ ແລະ ແຫຼ່ງຜະລິດ',
    'ເຂື່ອນໄຟຟ້ານໍ້າງຶມ4',
  ],
};