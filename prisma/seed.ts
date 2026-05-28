/**
 * Prisma seed (개발/시연용).
 *
 * 실행 방법:
 *   pnpm prisma db seed
 *   (또는 마이그레이션 시 자동 — package.json의 prisma.seed에 등록되어 있음)
 *
 * 시드 사용자(`demo@d-connect.kr`)를 생성하고, 익명으로 등록된 기존
 * Company.userId를 모두 시드 사용자에 귀속시킨다 (ADR-0005).
 *
 * 멱등성:
 *   - User.upsert로 중복 실행해도 동일 결과.
 *   - Company 백필은 userId가 NULL인 행만 갱신.
 */

import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../src/generated/prisma/client'

const DEMO_EMAIL = 'demo@d-connect.kr'
const DEMO_NAME = 'D-Connect 데모 계정'

async function main() {
  // src/server/db.ts와 동일한 패턴으로 PrismaClient 인스턴스화 (Prisma 7 adapter 필수)
  const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const url = databaseUrl.replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url })
  const db = new PrismaClient({ adapter })

  try {
    const demo = await db.user.upsert({
      where: { email: DEMO_EMAIL },
      update: {},
      create: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        emailVerified: new Date(),
      },
    })
    console.log(`✓ 시드 사용자 준비: ${demo.email} (id=${demo.id})`)

    const orphan = await db.company.updateMany({
      where: { userId: null },
      data: { userId: demo.id },
    })
    console.log(
      `✓ 익명 Company ${orphan.count}건을 데모 계정으로 귀속시켰습니다.`,
    )
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error('[seed] failed:', e)
  process.exitCode = 1
})
