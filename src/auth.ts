import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
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
 * - dev 환경 한정 Credentials provider — 시드 계정(demo@d-connect.kr) 자동 로그인
 *   (시연 안정성 / OAuth 키 없이도 흐름 검증 가능)
 * - Pages: signIn = /login (custom UI)
 */

const isDev = env.NODE_ENV !== 'production'
const DEMO_EMAIL = 'demo@d-connect.kr'

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

  if (isDev) {
    providers.push(
      Credentials({
        id: 'demo',
        name: '데모 계정 (dev)',
        // dev 전용 — production에서는 인증 거부
        credentials: {},
        async authorize() {
          if (!isDev) return null
          const user = await db.user.findUnique({
            where: { email: DEMO_EMAIL },
          })
          if (!user) {
            console.warn(
              `[auth] demo 사용자(${DEMO_EMAIL})가 DB에 없습니다. pnpm db:seed 실행 권장.`,
            )
            return null
          }
          return user
        },
      }),
    )
  }

  return providers
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  // NextAuth v5 + Credentials provider는 DB session 미지원. JWT로 통일한다.
  // OAuth 흐름에서도 adapter는 User/Account 행을 생성하지만, session 자체는 JWT cookie.
  // 트레이드오프 — 강제 로그아웃이 어렵지만 MVP 수용 가능.
  session: { strategy: 'jwt' },
  providers: buildProviders(),
  pages: {
    signIn: '/login',
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id
      }
      return session
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)

/**
 * UI에서 활성화된 provider만 노출하기 위한 helper.
 */
export function enabledProviders(): {
  kakao: boolean
  google: boolean
  demo: boolean
} {
  return {
    kakao: Boolean(env.KAKAO_CLIENT_ID && env.KAKAO_CLIENT_SECRET),
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    demo: isDev,
  }
}
