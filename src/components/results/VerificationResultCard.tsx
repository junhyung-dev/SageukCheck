"use client";

import React, { useState } from "react";
import { VerificationCitation, VerificationResult } from "@/types/verification";
import { stripCitationMarkers } from "@/lib/result-parser";
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface VerificationResultCardProps {
  result: VerificationResult;
  rawResponse?: unknown;
  fileName: string;
  /** `?debug=1`일 때만 원본 응답을 펼쳐 볼 수 있게 한다. */
  showDebug?: boolean;
  /** Called when the user opens a citation; the viewer shows its page and box. */
  onCitationSelect?: (citation: VerificationCitation) => void;
  activeCitationIndex?: number | null;
}

const CITATION_MARKER = /【†(\d+)】/g;

/**
 * Renders workflow text with each `【†n】` marker replaced by a page button.
 * Markers without a matching citation (or without a page) are dropped, never invented.
 */
function CitedText({
  text,
  citations,
  activeIndex,
  onSelect,
}: {
  text: string;
  citations: VerificationCitation[];
  activeIndex?: number | null;
  onSelect?: (citation: VerificationCitation) => void;
}) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(CITATION_MARKER)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    last = at + match[0].length;

    const citation = citations.find((c) => c.index === Number(match[1]));
    if (!citation || citation.page === null || !onSelect) continue;
    const active = activeIndex === citation.index;
    parts.push(
      <button
        key={`c-${at}`}
        type="button"
        onClick={() => onSelect(citation)}
        aria-pressed={active}
        aria-label={`근거 ${citation.index}: 원문 ${citation.page}쪽에서 보기`}
        className={`mx-0.5 inline-flex translate-y-[-1px] items-center rounded-sm border px-1.5 align-middle font-sans text-[11px] font-semibold leading-[18px] tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pine ${
          active
            ? "border-ink bg-ink text-white"
            : "border-border-strong bg-hanji text-ink-muted hover:border-ink hover:text-ink"
        }`}
      >
        {citation.page}쪽
      </button>
    );
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function VerificationResultCard({
  result,
  rawResponse,
  fileName,
  showDebug = false,
  onCitationSelect,
  activeCitationIndex,
}: VerificationResultCardProps) {
  const citations = result.citations ?? [];
  const canCite = Boolean(onCitationSelect) && citations.some((c) => c.page !== null);
  // Use the marker-annotated text only when it still has words once markers are removed.
  const withWords = (text?: string) =>
    text && stripCitationMarkers(text) ? text : undefined;
  const annotatedReason = withWords(result.annotatedFields?.reason);
  const annotatedSource = withWords(result.annotatedFields?.source_reference);
  const [copied, setCopied] = useState(false);
  const [showRawDebug, setShowRawDebug] = useState(false);

  const decisionStyle = (() => {
    switch (result.decision) {
      case "일치":
        return {
          tone: "border-pine/40 bg-pine-light text-pine",
          icon: <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />,
        };
      case "충돌":
        return {
          tone: "border-cinnabar/40 bg-cinnabar-light text-cinnabar",
          icon: <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />,
        };
      case "검토 필요":
      default:
        return {
          tone: "border-ochre-border bg-ochre-light text-ochre",
          icon: <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />,
        };
    }
  })();

  const handleCopyReport = async () => {
    const reportText = [
      "史劇Check 판정 결과",
      `문서: ${fileName}`,
      `장면: ${result.sceneId}`,
      `판정: ${result.decision}`,
      "",
      "[판정 근거]",
      result.reason,
      "",
      "[사료 출처]",
      result.sourceReference,
      "",
      "[빠진 문서]",
      result.missingDocuments.length > 0 ? result.missingDocuments.join(", ") : "없음",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // 클립보드 권한이 없으면 아무것도 하지 않는다.
    }
  };

  const sectionTitle = "text-sm font-semibold text-ink";

  return (
    <div className="flex flex-col space-y-5 break-keep print-full-width">
      <article className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 shadow-archive-md sm:p-8">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-5">
          <h2
            className={`inline-flex items-center gap-2 rounded-sm border px-3.5 py-2 font-serif text-xl font-bold ${decisionStyle.tone}`}
          >
            {decisionStyle.icon}
            <span>{result.decision}</span>
          </h2>
          <span className="text-sm font-medium tabular-nums text-ink-muted">
            {result.sceneId}
          </span>
        </header>

        {result.isUnstructuredFallback && (
          <p className="mt-5 rounded-sm border border-ochre-border bg-ochre-light/60 px-4 py-3 text-sm text-ink">
            응답 형식이 예상과 달라서 받은 내용을 그대로 보여 드려요.
          </p>
        )}

        <div className="mt-6 space-y-7">
          <section className="space-y-2">
            <h3 className={sectionTitle}>판정 근거</h3>
            {canCite && annotatedReason && (
              <p className="text-xs text-ink-muted">
                쪽 번호를 누르면 원문에서 위치를 보여 줘요.
              </p>
            )}
            <p className="whitespace-pre-line font-serif text-[15px] leading-[1.85] text-ink">
              {canCite && annotatedReason ? (
                <CitedText
                  text={annotatedReason}
                  citations={citations}
                  activeIndex={activeCitationIndex}
                  onSelect={onCitationSelect}
                />
              ) : (
                result.reason
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className={sectionTitle}>사료 출처</h3>
            <p className="font-serif text-[15px] leading-relaxed text-ink">
              {canCite && annotatedSource ? (
                <CitedText
                  text={annotatedSource}
                  citations={citations}
                  activeIndex={activeCitationIndex}
                  onSelect={onCitationSelect}
                />
              ) : (
                result.sourceReference
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className={sectionTitle}>빠진 문서</h3>
            {result.missingDocuments.length === 0 ? (
              <p className="text-sm text-ink-muted">없어요</p>
            ) : (
              <p className="text-sm font-semibold text-ink">
                {result.missingDocuments.join(", ")}
              </p>
            )}
          </section>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5 no-print">
          <button
            type="button"
            onClick={handleCopyReport}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-hanji-card px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-hanji-dark"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-pine" aria-hidden />
                <span className="text-pine">복사했어요</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden />
                <span>결과 복사</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pine-hover"
          >
            <Printer className="h-4 w-4" aria-hidden />
            <span>인쇄</span>
          </button>
        </div>
      </article>

      {showDebug && (
        <div className="overflow-hidden rounded-sm border border-border bg-hanji-card no-print">
          <button
            type="button"
            onClick={() => setShowRawDebug((prev) => !prev)}
            aria-expanded={showRawDebug}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-xs font-medium text-ink-muted transition-colors hover:bg-hanji/60"
          >
            <span>원본 응답 (디버그)</span>
            {showRawDebug ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>

          {showRawDebug && (
            <div className="space-y-3 border-t border-border bg-hanji/50 p-4 text-xs">
              {result.rawMetadata && (
                <pre className="overflow-x-auto rounded-sm border border-border bg-hanji-card p-3 font-mono text-xs text-ink">
                  {JSON.stringify(result.rawMetadata, null, 2)}
                </pre>
              )}
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-sm border border-border bg-hanji-card p-3 font-mono text-xs text-ink">
                {result.rawContent || "원본 문자열 없음"}
              </pre>
              {Boolean(rawResponse) && (
                <pre className="max-h-60 overflow-auto rounded-sm border border-border bg-hanji-card p-3 font-mono text-xs text-ink">
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
