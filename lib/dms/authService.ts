import apiClient from '@/config/axiosClient'
import { isAxiosError } from 'axios'
import type { CurrentUser } from '@/types/user'
import { normalizeAuthUser } from '@/types/user'

export interface LoginResult {
  accessToken: string
  user: CurrentUser
}

/**
 * ດຶງ object user ອອກຈາກ response ແບບຍືດຫຍຸ່ນ —
 * ຮອງຮັບ { user }, { data }, ຫຼື ຕົວ user ໂດຍກົງ.
 */
function unwrapUserPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const obj = data as Record<string, unknown>
  if ('user' in obj && obj.user) return obj.user
  if ('data' in obj && obj.data) return obj.data
  return data
}

function tokenOf(data: Record<string, unknown>): string {
  const token =
    typeof data.accessToken === 'string' ? data.accessToken :
    typeof data.access_token === 'string' ? data.access_token :
    typeof data.token === 'string' ? data.token :
    ''
  return token
}

function errorMessageOf(err: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(err)) {
    const data = err.response?.data
    if (data && typeof data.message === 'string' && data.message) return data.message
    if (data && Array.isArray(data.message) && data.message.length > 0) return data.message.join(', ')
  }
  if (err instanceof Error && err.message) return err.message
  return 'ການດຳເນີນການລົ້ມເຫຼວ'
}

/**
 * POST /auth/login — ກັບຄືນ JWT access token ແລະ ຂໍ້ມູນຜູ້ໃຊ້ງານທີ່ເຂົ້າລະບົບ.
 */
export async function login(payload: Record<string, unknown>): Promise<LoginResult> {
  const res = await apiClient.post<Record<string, unknown>>('/auth/login', payload)
  const data = res.data ?? {}
  const accessToken = tokenOf(data)
  const user = normalizeAuthUser(unwrapUserPayload(data))
  if (!accessToken || !user) {
    throw new Error('ການເຂົ້າສູ່ລະບົບລົ້ມເຫຼວ')
  }
  return { accessToken, user }
}

/**
 * GET /auth/me (fallback: GET /users/me) —
 * ດຶງຂໍ້ມູນຜູ້ໃຊ້ງານທີ່ເຂົ້າລະບົບ ຈາກ backend ບໍເລີ ຄື.
 * ຖ້າບໍ່ມີ endpoint ໃດ — ຄືນ null (ຜູ້ເອີ້ນຈະໃຊ້ cache ຕໍ່).
 */
export async function fetchMe(): Promise<CurrentUser | null> {
  for (const path of ['/auth/me', '/users/me']) {
    try {
      const res = await apiClient.get<unknown>(path)
      const user = normalizeAuthUser(unwrapUserPayload(res.data))
      if (user) return user
    } catch {
      // 200 ບໍ່ມີຜົນ? 404 ບໍ່ມີ endpoint? — ລອງ endpoint ຖັດໄປ
      // (401 ຈະຖືກຈັດການໂດຍ response interceptor ຂອງ axiosClient)
    }
  }
  return null
}

/** ສ້າງ payload ສຳລັບ PATCH ໂປຣໄຟລ໌ — ສົ່ງສະເພາະ field ທີ່ປ່ຽນ. */
function profilePatchPayload(patch: Partial<CurrentUser>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (patch.name !== undefined) payload.name = patch.name
  if (patch.email !== undefined) payload.email = patch.email
  if (patch.phone !== undefined) payload.phone = patch.phone
  if (patch.department !== undefined) payload.department = patch.department
  if (patch.division !== undefined) payload.division = patch.division
  if (patch.position !== undefined) payload.position = patch.position
  if (patch.avatarUrl !== undefined) payload.avatarUrl = patch.avatarUrl
  if (patch.status !== undefined) payload.status = patch.status
  return payload
}

export interface UpdateMyProfileResult {
  user: CurrentUser | null
  persisted: boolean
  error?: string
}

/**
 * PATCH ໂປຣໄຟລ໌ຂອງຕົນເອງ — ລອງ /auth/me, /users/me, ສຸດທ້າຍ /users/:id
 * (ໃຊ້ກັບ backend ທີ່ບໍ່ມີ /auth/me / /users/me).
 * ຄືນຂໍ້ມູນຜູ້ໃຊ້ງານທີ່ຖືກອັບເດດ (ຖ້າ backend ກັບຄືນ).
 */
export async function updateMyProfile(
  patch: Partial<CurrentUser>,
  ownId?: string,
): Promise<UpdateMyProfileResult> {
  const payload = profilePatchPayload(patch)
  const paths = [
    '/auth/me',
    '/users/me',
    ...(ownId ? [`/users/${encodeURIComponent(ownId)}`] : []),
  ]
  let lastError: unknown = null

  for (const path of paths) {
    try {
      const res = await apiClient.patch<unknown>(path, payload)
      const user = normalizeAuthUser(unwrapUserPayload(res.data))
      if (user) return { user, persisted: true }
      // 204 ບໍ່ມີ body — ລອງດຶງໃໝ່ ຈາກ /auth/me
      const fresh = await fetchMe()
      if (fresh) return { user: fresh, persisted: true }
      return { user: null, persisted: true }
    } catch (err) {
      lastError = err
      const status = isAxiosError(err) ? err.response?.status : null
      // 404/405 = ບໍ່ມີ endpoint ນີ້ — ລອງ ຕໍ່ໄປ; ຜິດພາດອື່ໆ (403/500...) ເຊົາ ແລະ ລາຍງານກັບຄືນ
      if (status === 404 || status === 405) continue
      break
    }
  }

  return { user: null, persisted: false, error: errorMessageOf(lastError) }
}