import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Kakao from 'next-auth/providers/kakao'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/server/db'
import { env } from '@/server/env'

/**
 * NextAuth v5 설정 (ADR-0004).
 *
 * - DB session (JWT 미사용) — adapter가 Session 테이블 활용
 * - Provider 미설정(env 비어있음) → 자동 비활성화. dev에서 일부만 켜고 시연 가능.
 * - Pages: signIn = /login (custom UI)
 */

function buildProviders(): NextAuthConfig['providers'] {
  const providers: NonNullable<NextAuthConfig['providers']> = []

  if (env.KAKAO_CLIENT_ID && env.KAKAO_CLIENT_SECRET) {
    providers.push(
      Kakao({
        clientId: env.KAKAO_CLIENT_ID,
        clientSecret: env.KAKAO_CLIENT_SECRET,
      }),
    )
  }

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    )
  }

  return providers
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: 'database' },
  providers: buildProviders(),
  pages: {
    signIn: '/login',
  },
  trustHost: true, // dev / 로컬·내부망 환경
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)

/**
 * UI에서 활성화된 provider만 노출하기 위한 helper.
 */
export function enabledProviders(): {
  kakao: boolean
  google: boolean
} {
  return {
    kakao: Boolean(env.KAKAO_CLIENT_ID && env.KAKAO_CLIENT_SECRET),
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  }
}
