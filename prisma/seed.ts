/**
 * Prisma seed (개발/시연용).
 *
 * 실행:
 *   pnpm db:seed
 *
 * demo@d-connect.kr 계정의 존재·비밀번호·약관 동의만 보장한다.
 *
 * #106에서 목업 기업 4종 시드를 제거 — 시연은 사용자가 직접 등록한
 * 실제 기업 데이터(예: 유클리드소프트)로 진행한다. 같은 이유로 기존의
 * "demo 계정 모든 기업 cascade 삭제 후 재생성" 로직도 제거 — 시드 실행이
 * 사용자가 만든 기업·분석·콘텐츠를 지우지 않는다 (비파괴).
 *
 * 멱등성:
 *   - User.upsert로 중복 실행 안전
 *   - 익명(userId=null) Company는 demo 계정에 귀속
 */

import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'

// bcrypt 해시 — src/server/password.ts는 'server-only' import이라 tsx 실행 환경에서
// 직접 못 쓴다. seed는 SALT_ROUNDS만 일치시키고 bcrypt를 직접 호출.
const SALT_ROUNDS = 10

const DEMO_EMAIL = 'demo@d-connect.kr'
const DEMO_NAME = 'D-Connect 데모'
const DEMO_PASSWORD = 'demo1234!'

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const url = databaseUrl.replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url })
  const db = new PrismaClient({ adapter })

  try {
    // 1. demo user upsert + 비밀번호 (시연 로그인용)
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS)
    const demo = await db.user.upsert({
      where: { email: DEMO_EMAIL },
      // acceptedTermsAt: 가입 완료 게이트(D8) 통과용 — 시드 계정이
      // /welcome으로 빠지지 않도록 항상 채운다.
      update: {
        password: passwordHash,
        name: DEMO_NAME,
        acceptedTermsAt: new Date(),
      },
      create: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        password: passwordHash,
        emailVerified: new Date(),
        acceptedTermsAt: new Date(),
      },
    })
    console.log(`✓ demo user 준비: ${demo.email} (id=${demo.id})`)

    // 2. 익명 Company → demo 계정 귀속
    const orphan = await db.company.updateMany({
      where: { userId: null },
      data: { userId: demo.id },
    })
    if (orphan.count > 0) {
      console.log(`✓ 익명 Company ${orphan.count}건을 demo 계정에 귀속`)
    }

    const companies = await db.company.count({ where: { userId: demo.id } })

    console.log(`\n✅ 시드 완료 (비파괴 — 기존 기업 데이터 유지)`)
    console.log(`   이메일:   ${DEMO_EMAIL}`)
    console.log(`   비밀번호: ${DEMO_PASSWORD}`)
    console.log(`   demo 계정 기업: ${companies}건`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error('[seed] failed:', e)
  process.exitCode = 1
})
