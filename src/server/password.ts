import 'server-only'
import bcrypt from 'bcrypt'

/**
 * bcrypt 패스워드 해시·검증 헬퍼.
 *
 * cost factor 10 — 모던 하드웨어에서 ~100ms. 시연 환경에서 적절.
 * 운영 단계 진입 시 12+로 상향 검토.
 */
const SALT_ROUNDS = 10

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
