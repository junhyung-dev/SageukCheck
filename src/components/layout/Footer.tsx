import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-hanji-dark/50 no-print">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-cinnabar/40 bg-cinnabar/10 font-serif text-[11px] font-bold text-cinnabar">
                史
              </span>
              <span className="font-serif text-base font-bold text-ink">
                史劇Check (사극체크)
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted max-w-xl">
              사극 대본과 역사 사료를 대조하여 역사적 사실의 일치 여부를 검증하는 AI 기반 역사 고증 검수 서비스.
              <br />
              본 서비스는 역사 고증을 지원하는 AI 기반 1차 검수 도구로, 최종적인 역사적 해석과 판단에는 전문가 검토가 필요할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-ink-muted">
            <Link href="/#about" className="hover:text-ink transition-colors">
              서비스 소개
            </Link>
            <Link href="/verify" className="hover:text-ink transition-colors">
              고증 검수 실행
            </Link>
            <Link
              href="/#samples"
              className="hover:text-ink transition-colors"
            >
              샘플 보기
            </Link>
            <span className="text-ink-light">
              Powered by Upstage Studio Agents API
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
