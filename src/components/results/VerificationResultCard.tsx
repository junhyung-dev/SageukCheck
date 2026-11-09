"use client";

import React, { useState } from "react";
import { VerificationResult } from "@/types/verification";
import { getVerificationRecommendation } from "@/lib/result-parser";
import {
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  BookOpen,
  FileWarning,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Code2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCheck2,
} from "lucide-react";

interface VerificationResultCardProps {
  result: VerificationResult;
  rawResponse?: unknown;
  fileName: string;
  onReset: () => void;
}

export function VerificationResultCard({
  result,
  rawResponse,
  fileName,
  onReset,
}: VerificationResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showRawDebug, setShowRawDebug] = useState(false);

  const recommendation = getVerificationRecommendation(result);

  const decisionConfig = (() => {
    switch (result.decision) {
      case "일치":
        return {
          label: "일치",
          subtitle: "제출된 역사 사료와 대본의 사실관계가 부합합니다",
          badgeBg: "bg-pine-light",
          badgeBorder: "border-pine/40",
          badgeText: "text-pine",
          headerBorder: "border-l-4 border-l-pine",
          icon: <CheckCircle2 className="h-5 w-5 text-pine shrink-0" />,
          sealChar: "合",
        };
      case "충돌":
        return {
          label: "충돌",
          subtitle: "대본의 역사적 서술이 제공된 사료 기록과 상충됩니다 (수정 필요)",
          badgeBg: "bg-cinnabar-light",
          badgeBorder: "border-cinnabar/40",
          badgeText: "text-cinnabar",
          headerBorder: "border-l-4 border-l-cinnabar",
          icon: <ShieldAlert className="h-5 w-5 text-cinnabar shrink-0" />,
          sealChar: "異",
        };
      case "검토 필요":
      default:
        return {
          label: "검토 필요",
          subtitle: "사료 판독 불가 또는 근거 문서 부족으로 추가 검토가 필요합니다",
          badgeBg: "bg-ochre-light",
          badgeBorder: "border-ochre-border",
          badgeText: "text-ochre",
          headerBorder: "border-l-4 border-l-ochre",
          icon: <AlertTriangle className="h-5 w-5 text-ochre shrink-0" />,
          sealChar: "考",
        };
    }
  })();

  const handleCopyReport = async () => {
    const missingText =
      result.missingDocuments.length > 0
        ? result.missingDocuments.join(", ")
        : "없음";

    const reportText = [
      `[史劇Check (사극체크) AI 역사 고증 검수 보고서]`,
      `- 검토 문서: ${fileName}`,
      `- 장면 ID: ${result.sceneId}`,
      `- 최종 판정: ${result.decision}`,
      ``,
      `1. 판정 근거 ( 검토 내용 )`,
      `${result.reason}`,
      ``,
      `2. 역사 사료 출처`,
      `${result.sourceReference}`,
      ``,
      `3. 누락된 문서`,
      `${missingText}`,
      ``,
      `4. 검토 권고`,
      `${recommendation}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col space-y-5 print-full-width">
      {/* Main Report Card */}
      <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 sm:p-8 shadow-archive-md">
        {/* Top Header: Scene ID & Decision Badge */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 pl-4 ${decisionConfig.headerBorder}`}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              <span>{result.sceneId}</span>
              <span>·</span>
              <span>역사 고증 검수 보고서</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink">
              {result.sceneId} · 역사 고증 검수
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              {decisionConfig.subtitle}
            </p>
          </div>

          {/* Decision Stamp / Badge with Icon + Text */}
          <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
            <div
              className={`inline-flex items-center gap-2 rounded-sm border px-4 py-2.5 shadow-archive ${decisionConfig.badgeBg} ${decisionConfig.badgeBorder} ${decisionConfig.badgeText}`}
            >
              {decisionConfig.icon}
              <div className="text-left">
                <div className="text-[10px] font-semibold uppercase opacity-80 leading-none">
                  최종 고증 판정
                </div>
                <div className="font-serif text-lg font-bold leading-tight mt-0.5">
                  [{decisionConfig.label}]
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if unstructured fallback occurred */}
        {result.isUnstructuredFallback && (
          <div className="mt-5 rounded-sm border border-ochre-border bg-ochre-light/60 p-3.5 text-xs text-ink">
            <div className="font-semibold text-ochre mb-0.5">
              비정형 응답 포맷 감지 안내
            </div>
            <p className="text-ink-muted">
              AI 워크플로우 응답이 표준 키-값 구조와 일부 달라 원문 응답을 보존하여 표시했습니다.
            </p>
          </div>
        )}

        {/* Report Body Sections */}
        <div className="mt-6 space-y-6">
          {/* Summary Metadata Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-sm border border-border bg-hanji/60 p-4 text-xs">
            <div>
              <span className="font-semibold text-ink-muted">판정 결과:</span>{" "}
              <span className={`font-bold ${decisionConfig.badgeText}`}>
                {result.decision}
              </span>
            </div>
            <div>
              <span className="font-semibold text-ink-muted">대상 장면:</span>{" "}
              <span className="font-mono font-semibold text-ink">
                {result.sceneId}
              </span>
            </div>
            <div className="sm:col-span-2 truncate">
              <span className="font-semibold text-ink-muted">검토 파일:</span>{" "}
              <span className="text-ink">{fileName}</span>
            </div>
          </div>

          {/* 1. 판정 근거 (reason) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pine">
              <FileCheck2 className="h-4 w-4" />
              <span>1. 판정 근거 (검토 내용)</span>
            </div>
            <div className="rounded-sm border border-border bg-hanji/35 p-4 sm:p-5">
              <p className="whitespace-pre-line font-serif text-sm sm:text-[15px] leading-relaxed text-ink">
                {result.reason}
              </p>
            </div>
          </section>

          {/* 2. 역사 사료 출처 (sourceReference) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pine">
              <BookOpen className="h-4 w-4" />
              <span>2. 역사 사료 출처</span>
            </div>
            <div className="rounded-sm border border-border bg-hanji-card p-4">
              <p className="font-serif text-sm font-semibold text-ink">
                {result.sourceReference}
              </p>
              <p className="mt-1 text-[11px] text-ink-muted">
                ※ 제출된 문서 내에서 AI 워크플로우가 확인한 사료 출처 표기입니다.
              </p>
            </div>
          </section>

          {/* 3. 누락된 문서 (missingDocuments) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pine">
              <FileWarning className="h-4 w-4" />
              <span>3. 누락된 문서 점검</span>
            </div>
            {result.missingDocuments.length === 0 ? (
              <div className="flex items-center gap-2 rounded-sm border border-border bg-hanji/40 px-4 py-3 text-xs text-ink-muted">
                <CheckCircle2 className="h-4 w-4 text-pine shrink-0" />
                <span>
                  누락된 필수 문서 없음 (대본 및 사료 구성 확인 완료)
                </span>
              </div>
            ) : (
              <div className="rounded-sm border border-ochre-border bg-ochre-light/70 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-ochre mb-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    고증 판정에 필요한 아래 문서가 누락되었거나 식별되지 않았습니다
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.missingDocuments.map((doc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-sm border border-ochre-border bg-hanji-card px-3 py-1 text-xs font-semibold text-ink"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 4. 검토 권고 (Recommendation) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pine">
              <Sparkles className="h-4 w-4" />
              <span>4. 검토 권고</span>
            </div>
            <div
              className={`rounded-sm border p-4 text-xs sm:text-sm leading-relaxed ${
                result.decision === "충돌"
                  ? "border-cinnabar/35 bg-cinnabar-light/50 text-ink"
                  : result.decision === "검토 필요"
                  ? "border-ochre-border bg-ochre-light/50 text-ink"
                  : "border-pine/30 bg-pine-light/40 text-ink"
              }`}
            >
              <p className="font-medium">{recommendation}</p>
            </div>
          </section>
        </div>

        {/* Notice */}
        <div className="mt-6 border-t border-border pt-4 text-[11px] text-ink-muted leading-relaxed">
          본 결과는 제출된 문서 내 사료만을 근거로 Upstage Studio 워크플로우가 판정한 1차 고증 검수 결과입니다. AI가 제공하지 않은 외부 문장이나 출처를 임의로 생성하지 않습니다.
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 no-print">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-sm border border-border-strong bg-hanji-card px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-hanji-dark"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>다른 문서 분석</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-hanji-card px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-hanji-dark"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-pine" />
                  <span className="text-pine">복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>결과 복사</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2.5 text-xs font-semibold text-white shadow-archive transition-colors hover:bg-pine-hover"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>보고서 인쇄 / PDF 저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* Developer Debugging Accordion (원본 API 응답 확인 기능) */}
      <div className="rounded-sm border border-border bg-hanji-card overflow-hidden no-print">
        <button
          type="button"
          onClick={() => setShowRawDebug((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-3 text-left text-xs font-medium text-ink-muted hover:bg-hanji/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-pine" />
            <span>Upstage Studio Instruct 노드 원본 응답 (디버그 보기)</span>
          </div>
          {showRawDebug ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showRawDebug && (
          <div className="border-t border-border bg-hanji/50 p-4 space-y-3 text-xs">
            {result.rawMetadata && (
              <div>
                <div className="font-mono text-[11px] font-semibold text-ink-muted mb-1">
                  metadata (enum 판정값):
                </div>
                <pre className="overflow-x-auto rounded-sm border border-border bg-hanji-card p-3 font-mono text-[11px] text-ink">
                  {JSON.stringify(result.rawMetadata, null, 2)}
                </pre>
              </div>
            )}
            <div>
              <div className="font-mono text-[11px] font-semibold text-ink-muted mb-1">
                content (Instruct 노드 문자열):
              </div>
              <pre className="whitespace-pre-wrap overflow-x-auto rounded-sm border border-border bg-hanji-card p-3 font-mono text-[11px] text-ink">
                {result.rawContent || "원본 문자열 없음"}
              </pre>
            </div>
            {Boolean(rawResponse) && (
              <div>
                <div className="font-mono text-[11px] font-semibold text-ink-muted mb-1">
                  Full API Response JSON:
                </div>
                <pre className="max-h-60 overflow-y-auto overflow-x-auto rounded-sm border border-border bg-hanji-card p-3 font-mono text-[11px] text-ink">
                  {JSON.stringify(rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
