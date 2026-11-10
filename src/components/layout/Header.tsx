"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

const NAV_LINK =
  "whitespace-nowrap rounded-sm px-2.5 py-1.5 transition-colors hover:bg-hanji-dark/60 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-pine";

export function Header() {
  const pathname = usePathname();
  const isVerifyPage = pathname?.startsWith("/verify");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-hanji/95 backdrop-blur-sm no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-pine"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-cinnabar/40 bg-cinnabar/10 font-serif text-xs font-bold text-cinnabar transition-colors group-hover:bg-cinnabar group-hover:text-white"
          >
            史
          </span>
          <span className="whitespace-nowrap font-serif text-lg font-bold tracking-tight text-ink sm:text-xl">
            史劇Check
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium text-ink-muted sm:gap-3">
          <Link href="/#about" className={NAV_LINK}>
            소개
          </Link>
          <Link href="/#samples" className={NAV_LINK}>
            샘플
          </Link>
          <Link
            href="/verify"
            aria-current={isVerifyPage ? "page" : undefined}
            className={`ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-hanji sm:px-4 ${
              isVerifyPage
                ? "bg-pine-light text-pine"
                : "bg-pine text-white hover:bg-pine-hover"
            }`}
          >
            검수 시작
            {!isVerifyPage && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
          </Link>
        </nav>
      </div>
    </header>
  );
}
