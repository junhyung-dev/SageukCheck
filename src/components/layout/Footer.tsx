import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-hanji-dark/50 no-print">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 break-keep sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-cinnabar/40 bg-cinnabar/10 font-serif text-[11px] font-bold text-cinnabar"
              >
                史
              </span>
              <span className="font-serif text-base font-bold text-ink">
                史劇Check (사극체크)
              </span>
            </div>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-muted">
              사극 대본과 사료를 대조해 장면의 고증을 판정해요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-ink-muted">
            <Link href="/#about" className="hover:text-ink transition-colors">
              소개
            </Link>
            <Link href="/#samples" className="hover:text-ink transition-colors">
              샘플
            </Link>
            <Link href="/verify" className="hover:text-ink transition-colors">
              검수 시작
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
