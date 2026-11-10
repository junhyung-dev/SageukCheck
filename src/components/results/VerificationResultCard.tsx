"use client";

import React, { useState } from "react";
import { VerificationCitation, VerificationResult } from "@/types/verification";
import { stripCitationMarkers } from "@/lib/result-parser";
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  BookOpen,
  FileSearch,
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

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
      <span className="text-pine" aria-hidden>
        {icon}
      </span>
      {children}
    </h3>
  );
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
          meaning: "대본의 역사 주장이 첨부한 사료 기록과 맞아요.",
          icon: <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />,
        };
      case "충돌":
        return {
          tone: "border-cinnabar/40 bg-cinnabar-light text-cinnabar",
          meaning: "대본의 역사 주장이 첨부한 사료 기록과 달라요.",
          icon: <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />,
        };
      case "검토 필요":
      default:
        return {
          tone: "border-ochre-border bg-ochre-light text-ochre",
          meaning: "첨부한 문서만으로는 판단할 수 없어요. 사람이 확인해 주세요.",
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

  return (
    <div className="flex flex-col space-y-5 break-keep print-full-width">
      <article className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 shadow-archive-md sm:p-8">
        <header className="border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2
              className={`seal-press inline-flex items-center gap-2 rounded-sm border px-4 py-2 font-serif text-2xl font-bold ${decisionStyle.tone}`}
            >
              {decisionStyle.icon}
              <span>{result.decision}</span>
            </h2>
            <span className="text-sm font-semibold tabular-nums text-ink-muted">
              {result.sceneId}
            </span>
          </div>
          <p className="mt-3 text-[15px] text-ink">{decisionStyle.meaning}</p>
        </header>

        {result.isUnstructuredFallback && (
          <p className="mt-5 rounded-sm bg-ochre-light/70 px-4 py-3 text-sm text-ink">
            응답 형식이 예상과 달라서 받은 내용을 그대로 보여 드려요.
          </p>
        )}

        <div className="mt-7 space-y-7">
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <SectionTitle icon={<FileCheck2 className="h-4 w-4" />}>판정 근거</SectionTitle>
              {canCite && annotatedReason && (
                <span className="text-xs text-ink-muted">
                  쪽 번호를 누르면 원문에서 위치를 보여 줘요
                </span>
              )}
            </div>
            <div className="rounded-sm bg-hanji/70 px-5 py-4">
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
            </div>
          </section>

          <section className="space-y-2.5">
            <SectionTitle icon={<BookOpen className="h-4 w-4" />}>사료 출처</SectionTitle>
            <div className="rounded-sm bg-hanji/70 px-5 py-4">
              <p className="font-serif text-[15px] font-semibold leading-relaxed text-ink">
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
            </div>
          </section>

          <section className="space-y-2.5">
            <SectionTitle icon={<FileSearch className="h-4 w-4" />}>빠진 문서</SectionTitle>
            {result.missingDocuments.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-sm bg-hanji/70 px-5 py-3.5 text-sm text-ink">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-pine" aria-hidden />
                <span>없어요. 대본과 사료를 모두 찾았어요.</span>
              </div>
            ) : (
              <div className="rounded-sm bg-ochre-light/70 px-5 py-3.5">
                <div className="flex items-center gap-2.5 text-sm text-ink">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-ochre" aria-hidden />
                  <span>이 문서를 찾지 못했어요.</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2 pl-[26px]">
                  {result.missingDocuments.map((doc) => (
                    <span
                      key={doc}
                      className="rounded-sm border border-ochre-border bg-hanji-card px-2.5 py-1 text-sm font-semibold text-ink"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
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
