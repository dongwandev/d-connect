import { CompanyForm } from '@/components/CompanyForm'

/**
 * 첫 화면 — 기업 정보 입력 폼.
 *
 * PRD §3.1 + API.md §3.1 + Architecture: server component가 leaf의 client
 * 폼 컴포넌트를 렌더한다.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <CompanyForm />
    </main>
  )
}
