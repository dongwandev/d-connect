import 'server-only'
import OpenAI from 'openai'
import { env } from '../env'

/**
 * OpenAI SDK 인스턴스 (#92 — ADR-0002 추록: 비용 사유로 Anthropic→OpenAI 전환).
 *
 * Anthropic SDK와 달리 OpenAI SDK는 키가 비어 있으면 생성자에서 throw하므로
 * **지연 초기화**한다 — 키 없는 환경(CI 빌드, mock 모드)에서 모듈 로드가
 * 깨지지 않아야 한다. 호출부는 hasApiKey() 확인 후에만 getOpenAI()를 부른다
 * (PRD §5.2 mock fallback).
 */
let client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY })
  return client
}

export const hasApiKey = (): boolean => Boolean(env.OPENAI_API_KEY)
