import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Kakao from 'next-auth/providers/kakao'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { LoginSchema } from '@/app/api/auth/register/schemas'
import { db } from '@/server/db'
import { env } from '@/server/env'
import { verifyPassword } from '@/server/password'

/**
 * NextAuth v5 설정 (ADR-0004).
 *
 * 인증 방식:
 *   - 이메일/패스워드 (Credentials, 'credentials') — 주 회원가입 흐름
 *   - Kakao / Google — 간편 로그인 (env 미설정 시 자동 비활성)
 *   - 데모 계정 (Credentials, 'demo') — dev 한정 시연용
 *
 * Session: JWT (Credentials 호환). adapter는 User/Account 생성에 활용.
 */

const isDev = env.NODE_ENV !== 'production'
const DEMO_EMAIL = 'demo@d-connect.kr'

function buildProviders(): NextAuthConfig['providers'] {
  const providers: NonNullable<NextAuthConfig['providers']> = []

  // 1) 이메일/패스워드 — 항상 등록
  providers.push(
    Credentials({
      id: 'credentials',
      name: '이메일·비밀번호',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(rawCreds) {
        const parsed = LoginSchema.safeParse(rawCreds)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user?.password) return null // OAuth 또는 demo 계정은 거부

        const ok = await verifyPassword(parsed.data.password, user.password)
        if (!ok) return null

        return user
      },
    }),
  )

  // 2) Kakao
  if (env.KAKAO_CLIENT_ID && env.KAKAO_CLIENT_SECRET) {
    providers.push(
      Kakao({
        clientId: env.KAKAO_CLIENT_ID,
        clientSecret: env.KAKAO_CLIENT_SECRET,
      }),
    )
  }

  // 3) Google
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    )
  }

  // 4) dev 한정 demo 계정 — production에선 자동 비활성
  if (isDev) {
    providers.push(
      Credentials({
        id: 'demo',
        name: '데모 계정 (dev)',
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
 * UI에서 활성화된 social provider만 노출하기 위한 helper.
 * (이메일/패스워드는 항상 활성)
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
