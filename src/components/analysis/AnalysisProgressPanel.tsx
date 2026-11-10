"use client";

import React, { useEffect, useState } from "react";
import { JobStatus } from "@/types/verification";
import { Check, XCircle, RotateCcw } from "lucide-react";

interface AnalysisProgressPanelProps {
  status: JobStatus;
  elapsedSeconds: number;
  errorMessage: string | null;
  onRetry: () => void;
  onCancelOrReset: () => void;
  /** 화면이 마지막 단계("결과 보기")까지 보여 준 뒤 한 번 불린다. */
  onDone?: () => void;
  /** 결과 화면으로 넘어가는 중이면 true. 패널이 사라지는 전환을 건다. */
  leaving?: boolean;
}

/** 단계 하나를 보여 주는 최소 시간. API가 몇 단계를 한 번에 건너뛰어도 차례대로 보이게 한다. */
const STEP_DWELL_MS = 650;
/** "판정이 끝났어요"를 보여 준 뒤 결과 화면으로 넘어가기까지의 시간. */
const DONE_HOLD_MS = 900;

type Step = {
  label: string;
  /** Studio 워크플로우 안에서 차례로 일어나는 일. API는 노드별 진행을 알려 주지 않아 표시만 한다. */
  inside?: { title: string; detail: string }[];
};

const STEPS: Step[] = [
  { label: "PDF 올리기" },
  { label: "분석 순서 기다리기" },
  {
    label: "워크플로우 실행",
    inside: [
      { title: "문서 나누기", detail: "PDF를 읽고 대본, 사료, 검토 요청서로 나눠요" },
      { title: "주장과 기록 찾기", detail: "대본의 역사 주장과 사료 기록에서 인물, 행동, 날짜를 뽑아요" },
      { title: "판정 내리기", detail: "둘을 맞대 보고 일치, 충돌, 검토 필요 중 하나로 정해요" },
    ],
  },
  { label: "결과 보기" },
];

const STEP_INDEX: Record<JobStatus, number> = {
  uploading: 0,
  queued: 1,
  in_progress: 2,
  completed: 3,
  failed: -1,
};

const HEADLINE: Record<JobStatus, string> = {
  uploading: "PDF를 올리고 있어요",
  queued: "분석 순서를 기다리고 있어요",
  in_progress: "대본과 사료를 대조하고 있어요",
  completed: "판정이 끝났어요",
  failed: "결과를 받지 못했어요",
};

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
}

function StepMarker({ state }: { state: "done" | "current" | "upcoming" }) {
  if (state === "done") {
    return (
      <span className="step-mark-in flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="step-mark-in relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-pine bg-hanji-card">
        <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-pine/50 motion-reduce:animate-none" />
        <span className="h-2.5 w-2.5 rounded-full bg-pine" />
      </span>
    );
  }
  return <span className="block h-6 w-6 shrink-0 rounded-full border-2 border-border-strong bg-hanji-card" />;
}

export function AnalysisProgressPanel({
  status,
  elapsedSeconds,
  errorMessage,
  onRetry,
  onCancelOrReset,
  onDone,
  leaving = false,
}: AnalysisProgressPanelProps) {
  const isFailed = status === "failed";
  const targetIndex = STEP_INDEX[status];

  // 실제 상태(targetIndex)를 한 단계씩 따라간다. 뒤로 가는 경우(다시 시도)는 바로 맞춘다.
  const [shownIndex, setShownIndex] = useState(Math.max(targetIndex, 0));
  useEffect(() => {
    if (isFailed) return;
    if (targetIndex < shownIndex) {
      setShownIndex(targetIndex);
      return;
    }
    if (targetIndex > shownIndex) {
      const timer = setTimeout(() => setShownIndex((i) => i + 1), STEP_DWELL_MS);
      return () => clearTimeout(timer);
    }
  }, [isFailed, targetIndex, shownIndex]);

  const lastIndex = STEPS.length - 1;
  const isShowingDone = !isFailed && shownIndex === lastIndex && targetIndex === lastIndex;
  useEffect(() => {
    if (!isShowingDone || !onDone) return;
    const timer = setTimeout(onDone, DONE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [isShowingDone, onDone]);

  const activeIndex = shownIndex;
  const shownStatus: JobStatus = isFailed
    ? "failed"
    : (Object.keys(STEP_INDEX) as JobStatus[]).find((key) => STEP_INDEX[key] === shownIndex) ?? status;
  // 조회가 한 번 실패해도 작업은 계속 확인한다. 그동안 알림만 보여 준다.
  const connectionNote = !isFailed ? errorMessage : null;

  return (
    <div className={`mx-auto max-w-2xl break-keep ${leaving ? "view-exit" : "view-enter"}`}>
      <div className="rounded-sm border border-border bg-hanji-card p-6 shadow-archive-md sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <div role="status" aria-live="polite">
            {isFailed && <XCircle className="mb-3 h-7 w-7 text-cinnabar" aria-hidden />}
            <h2
              key={shownStatus}
              className="text-swap font-serif text-xl font-bold text-ink sm:text-2xl"
            >
              {HEADLINE[shownStatus]}
            </h2>
            {isFailed && (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {errorMessage || "잠시 뒤 다시 시도해 주세요."}
              </p>
            )}
            {connectionNote && (
              <p className="mt-2 text-sm font-medium text-ink">{connectionNote}</p>
            )}
          </div>

          {!isFailed && (
            <div className="shrink-0 text-right">
              <div className="text-xs text-ink-muted">지난 시간</div>
              <div className="mt-0.5 font-serif text-xl font-bold tabular-nums text-ink">
                {formatElapsed(elapsedSeconds)}
              </div>
            </div>
          )}
        </div>

        {!isFailed ? (
          <ol className="mt-8 border-t border-border pt-7">
            {STEPS.map((step, index) => {
              const state =
                index < activeIndex || (index === activeIndex && isShowingDone)
                  ? "done"
                  : index === activeIndex
                  ? "current"
                  : "upcoming";
              const isLast = index === STEPS.length - 1;
              return (
                <li
                  key={step.label}
                  aria-current={state === "current" ? "step" : undefined}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {!isLast && (
                    <span aria-hidden className="absolute left-[11px] top-7 bottom-1 w-0.5 bg-border">
                      <span
                        className={`step-line-fill block h-full w-full bg-pine ${
                          state === "done" ? "scale-y-100" : "scale-y-0"
                        }`}
                      />
                    </span>
                  )}
                  <StepMarker state={state} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`text-[15px] transition-colors duration-300 ${
                          state === "upcoming"
                            ? "text-ink-muted"
                            : state === "current"
                            ? "font-semibold text-ink"
                            : "text-ink"
                        }`}
                      >
                        {step.label}
                      </span>
                      <span key={state} className="text-swap shrink-0 text-xs text-ink-muted">
                        {state === "done" ? "끝났어요" : state === "current" ? "진행 중" : ""}
                      </span>
                    </div>

                    {step.inside && (
                      <div
                        className={`mt-3 rounded-sm px-4 py-3.5 transition-colors duration-500 ${
                          state === "current" ? "bg-pine-light/60" : "bg-hanji/70"
                        }`}
                      >
                        <ol className="space-y-2.5">
                          {step.inside.map((item, i) => (
                            <li key={item.title} className="flex gap-3 text-sm">
                              <span className="w-4 shrink-0 text-right font-semibold tabular-nums text-pine">
                                {i + 1}
                              </span>
                              <span>
                                <span className="font-semibold text-ink">{item.title}</span>
                                <span className="block text-ink-muted">{item.detail}</span>
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-8 flex flex-wrap gap-2.5 border-t border-border pt-6">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine-hover"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              <span>다시 시도</span>
            </button>
            <button
              type="button"
              onClick={onCancelOrReset}
              className="inline-flex items-center rounded-sm border border-border-strong bg-hanji-card px-4 py-2 text-sm font-medium text-ink hover:bg-hanji-dark"
            >
              다른 문서 고르기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
