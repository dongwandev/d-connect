import 'server-only'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@/generated/prisma/client'
import { env } from './env'

/**
 * Prisma Client 글로벌 싱글톤.
 *
 * Prisma 7부터 datasource url은 schema가 아닌 runtime adapter로 전달한다.
 * 본 모듈은 SQLite + better-sqlite3 adapter를 사용한다 (DB_SCHEMA §1).
 *
 * Next.js dev HMR로 모듈이 재로드될 때마다 새 PrismaClient가 만들어지면
 * DB 커넥션이 누수되므로 globalThis에 캐시한다.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

function createPrismaClient(): PrismaClient {
  // env.DATABASE_URL 예시: "file:./dev.db" → better-sqlite3는 파일 경로만 받음
  const url = env.DATABASE_URL.replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter })
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
