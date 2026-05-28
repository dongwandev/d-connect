import { handlers } from '@/auth'

/**
 * NextAuth v5의 catch-all handler.
 * GET, POST 모두 NextAuth가 처리한다.
 */
export const { GET, POST } = handlers
