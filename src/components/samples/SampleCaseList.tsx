"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { DECISION_ORDER, SAMPLE_DATASETS } from "@/lib/sample-datasets";
import { SampleDataset, VerificationDecision } from "@/types/verification";

const DECISION_STYLE: Record<
  VerificationDecision,
  { text: string; rule: string; note: string }
> = {
  일치: {
    text: "text-pine",
    rule: "border-pine",
    note: "사료가 대본 주장을 뒷받침해요.",
  },
  충돌: {
    text: "text-cinnabar",
    rule: "border-cinnabar",
    note: "사료가 대본 주장과 정면으로 어긋나요.",
  },
  "검토 필요": {
    text: "text-ochre",
    rule: "border-ochre",
    note: "사료가 없거나, 읽을 수 없거나, 다른 사건을 다뤄요.",
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
  return Array.from(counts, ([label, n]) => (n > 1 ? `${label} ${n}건` : label)).join(", ");
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

const ROW =
  "group flex w-full items-baseline justify-between gap-4 px-2 py-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine";

/**
 * The 18 final dataset cases, one tab per expected decision in the answer sheet.
 * `select` loads a case into the upload panel; `link` opens /verify with the case preloaded.
 */
export function SampleCaseList(props: SampleCaseListProps) {
  const selectedId = props.mode === "select" ? props.selectedId : null;
  const selectedDecision = SAMPLE_DATASETS.find((s) => s.id === selectedId)?.expectedDecision;

  const [active, setActive] = useState<VerificationDecision>(selectedDecision ?? DECISION_ORDER[0]);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // A sample chosen from elsewhere (e.g. ?sample=set02) opens its own tab.
  useEffect(() => {
    if (selectedDecision) setActive(selectedDecision);
  }, [selectedDecision]);

  const moveTab = (step: number) => {
    const next =
      DECISION_ORDER[(DECISION_ORDER.indexOf(active) + step + DECISION_ORDER.length) % DECISION_ORDER.length];
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const cases = SAMPLE_DATASETS.filter((s) => s.expectedDecision === active);
  const style = DECISION_STYLE[active];

  return (
    <div className="break-keep">
      <div
        role="tablist"
        aria-label="기대 판정"
        className="flex gap-6 border-b border-border"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") moveTab(1);
          if (e.key === "ArrowLeft") moveTab(-1);
        }}
      >
        {DECISION_ORDER.map((decision) => {
          const isActive = decision === active;
          const count = SAMPLE_DATASETS.filter((s) => s.expectedDecision === decision).length;
          return (
            <button
              key={decision}
              ref={(el) => {
                tabRefs.current[decision] = el;
              }}
              type="button"
              role="tab"
              id={`sample-tab-${decision}`}
              aria-selected={isActive}
              aria-controls="sample-tabpanel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(decision)}
              className={`-mb-px flex items-baseline gap-1.5 border-b-2 pb-3 pt-1 font-serif text-base font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
                isActive
                  ? `${DECISION_STYLE[decision].rule} ${DECISION_STYLE[decision].text}`
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {decision}
              <span className="font-sans text-xs font-semibold tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      <div
        key={active}
        id="sample-tabpanel"
        role="tabpanel"
        aria-labelledby={`sample-tab-${active}`}
        className="text-swap"
      >
        <p className="mt-4 text-sm text-ink-muted">{style.note}</p>

        <ul className="-mx-2 mt-3 grid grid-cols-1 gap-x-6 lg:grid-cols-2">
          {cases.map((sample) => {
            const title = (
              <span className="min-w-0 font-serif text-sm font-bold text-ink group-hover:text-pine sm:text-[15px]">
                {sample.episode}
              </span>
            );

            if (props.mode === "link") {
              return (
                <li key={sample.id} className="border-b border-border">
                  <Link href={`/verify?sample=${sample.id}`} className={`${ROW} hover:bg-hanji-dark/50`}>
                    {title}
                    <span className="shrink-0 text-xs text-ink-muted">
                      {shortDocuments(sample.documents)}
                    </span>
                  </Link>
                </li>
              );
            }

            const isSelected = props.selectedId === sample.id;
            const isLoading = props.loadingId === sample.id;
            return (
              <li key={sample.id} className="border-b border-border">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={props.disabled || isLoading}
                  onClick={() => props.onSelect(sample)}
                  className={`${ROW} disabled:cursor-wait ${
                    isSelected ? "bg-pine-light" : "hover:bg-hanji-dark/50"
                  }`}
                >
                  {title}
                  <span
                    className={`flex shrink-0 items-center gap-1 text-xs ${
                      isSelected || isLoading ? "font-semibold text-pine" : "text-ink-muted"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden />
                        불러오는 중
                      </>
                    ) : isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                        골랐어요
                      </>
                    ) : (
                      shortDocuments(sample.documents)
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
