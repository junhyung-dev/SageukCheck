"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { DECISION_ORDER, SAMPLE_DATASETS } from "@/lib/sample-datasets";
import { SampleDataset, VerificationDecision } from "@/types/verification";

const DECISION_STYLE: Record<
  VerificationDecision,
  { text: string; rule: string; note: string }
> = {
  일치: {
    text: "text-pine",
    rule: "border-pine",
    note: "사료가 대본 주장을 뒷받침",
  },
  충돌: {
    text: "text-cinnabar",
    rule: "border-cinnabar",
    note: "사료가 대본 주장과 정면으로 어긋남",
  },
  "검토 필요": {
    text: "text-ochre",
    rule: "border-ochre",
    note: "사료 누락 · 판독 불가 · 다른 사건 · 기록 없음",
  },
};

function shortDocuments(documents: string[]): string {
  const counts = new Map<string, number>();
  for (const doc of documents) {
    const label = doc
      .replace("사극 촬영 대본", "대본")
      .replace("저품질 역사 사료", "저품질 사료")
      .replace("역사 고증 검토 요청서", "요청서")
      .replace("역사 사료", "사료");
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts, ([label, n]) => (n > 1 ? `${label} ${n}건` : label)).join(" · ");
}

type SampleCaseListProps =
  | {
      mode: "select";
      selectedId?: string | null;
      loadingId?: string | null;
      disabled?: boolean;
      onSelect: (sample: SampleDataset) => void;
    }
  | { mode: "link" };

/**
 * The 18 final dataset cases, grouped by their expected decision in the answer sheet.
 * `select` loads a case into the upload panel; `link` opens /verify with the case preloaded.
 */
export function SampleCaseList(props: SampleCaseListProps) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
      {DECISION_ORDER.map((decision) => {
        const cases = SAMPLE_DATASETS.filter((s) => s.expectedDecision === decision);
        const style = DECISION_STYLE[decision];
        return (
          <section key={decision} aria-labelledby={`cases-${decision}`}>
            <header className={`border-t-2 pt-3 ${style.rule}`}>
              <h3
                id={`cases-${decision}`}
                className={`flex items-baseline justify-between font-serif text-base font-bold ${style.text}`}
              >
                <span>{decision}</span>
                <span className="font-sans text-xs font-semibold tabular-nums text-ink-muted">
                  {cases.length}건
                </span>
              </h3>
              <p className="mt-0.5 break-keep text-xs text-ink-muted">{style.note}</p>
            </header>

            <ul className="mt-3 divide-y divide-border border-y border-border">
              {cases.map((sample) => {
                const body = (
                  <>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="break-keep font-serif text-sm font-bold text-ink group-hover:text-pine">
                        {sample.episode}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-ink-light">
                        {sample.code}
                      </span>
                    </span>
                    <span className="mt-1 block break-keep text-xs text-ink-muted">
                      {sample.title} · {shortDocuments(sample.documents)} · {sample.pages}쪽
                    </span>
                  </>
                );

                if (props.mode === "link") {
                  return (
                    <li key={sample.id}>
                      <Link
                        href={`/verify?sample=${sample.id}`}
                        className="group block px-1 py-3 transition-colors hover:bg-hanji-dark/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
                      >
                        {body}
                      </Link>
                    </li>
                  );
                }

                const isSelected = props.selectedId === sample.id;
                const isLoading = props.loadingId === sample.id;
                return (
                  <li key={sample.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      disabled={props.disabled || isLoading}
                      onClick={() => props.onSelect(sample)}
                      className={`group relative block w-full px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:cursor-wait ${
                        isSelected ? "bg-pine-light" : "hover:bg-hanji-dark/50"
                      }`}
                    >
                      {isSelected && (
                        <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-pine" />
                      )}
                      {body}
                      {(isSelected || isLoading) && (
                        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-pine">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              PDF 불러오는 중
                            </>
                          ) : (
                            "선택됨 · 위에서 분석을 시작하세요"
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
