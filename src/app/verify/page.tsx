"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PdfUploadPanel } from "@/components/upload/PdfUploadPanel";
import { AnalysisProgressPanel } from "@/components/analysis/AnalysisProgressPanel";
import { VerificationResultCard } from "@/components/results/VerificationResultCard";
import {
  CitationFocus,
  PdfDocumentViewer,
} from "@/components/pdf/PdfDocumentViewer";
import { SAMPLE_DATASETS, sampleUploadName } from "@/lib/sample-datasets";
import {
  CreateVerifyApiResponse,
  JobStatus,
  PollJobApiResponse,
  VerificationCitation,
  VerificationResult,
} from "@/types/verification";
import { ArrowLeft, FileText } from "lucide-react";

type ViewStep = "upload" | "analyzing" | "result";

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_TIME_SECONDS = 300; // 5 minutes timeout guard

function VerifyWorkspaceContent() {
  const searchParams = useSearchParams();
  const sampleParam = searchParams.get("sample");
  const debugParam = searchParams.get("debug") === "1";

  const [viewStep, setViewStep] = useState<ViewStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>("uploading");
  const [fileId, setFileId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<unknown>(null);
  const [citationFocus, setCitationFocus] = useState<CitationFocus | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const handleCitationSelect = useCallback((citation: VerificationCitation) => {
    setCitationFocus((prev) => ({ citation, nonce: (prev?.nonce ?? 0) + 1 }));
    // Below the desktop breakpoint the viewer sits above the report: bring it into view.
    if (window.innerWidth < 1024) {
      viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Preload sample dataset if ?sample=set01..set18 is in the URL
  useEffect(() => {
    if (!sampleParam) return;
    const matched = SAMPLE_DATASETS.find(
      (s) => s.id.toLowerCase() === sampleParam.toLowerCase()
    );
    if (!matched) return;

    let cancelled = false;
    async function loadSampleFromQuery() {
      try {
        const res = await fetch(matched!.filename);
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        const file = new File([blob], sampleUploadName(matched!), {
          type: "application/pdf",
        });
        setSelectedFile(file);
      } catch {
        // Ignore
      }
    }
    loadSampleFromQuery();

    return () => {
      cancelled = true;
    };
  }, [sampleParam]);

  // 경과 시간은 "분석 시작"을 누른 순간부터 센다(업로드 시간 포함).
  const startElapsedTimer = useCallback(() => {
    const startedAt = Date.now();
    setElapsedSeconds(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
  }, []);

  const startPollingJob = useCallback(
    (activeJobId: string, activeFileId: string) => {
      // 시간 초과는 워크플로우 실행 요청이 끝난 뒤부터 잰다.
      const pollStartedAt = Date.now();

      const pollOnce = async () => {
        if ((Date.now() - pollStartedAt) / 1000 > MAX_POLL_TIME_SECONDS) {
          clearTimers();
          setJobStatus("failed");
          setErrorMessage(
            "5분이 지나도 결과가 오지 않았어요. 잠시 뒤 다시 시도해 주세요."
          );
          return;
        }
        try {
          const query = activeFileId
            ? `?fileId=${encodeURIComponent(activeFileId)}`
            : "";
          const res = await fetch(
            `/api/jobs/${encodeURIComponent(activeJobId)}${query}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const data = (await res.json()) as PollJobApiResponse & {
            error?: string;
          };

          if (!res.ok) {
            clearTimers();
            setJobStatus("failed");
            setErrorMessage(
              data.error ||
                `진행 상황을 확인하지 못했어요. 다시 시도해 주세요. (오류 코드 ${res.status})`
            );
            return;
          }

          if (data.status === "failed") {
            clearTimers();
            setJobStatus("failed");
            setErrorMessage(
              data.error ||
                "워크플로우가 판정을 끝내지 못했어요. 다시 시도해 주세요."
            );
            return;
          }

          if (data.status === "completed") {
            clearTimers();
            if (!data.result) {
              setJobStatus("failed");
              setErrorMessage(
                "분석은 끝났지만 결과를 읽지 못했어요. 다시 시도해 주세요."
              );
              return;
            }
            setJobStatus("completed");
            setVerificationResult(data.result);
            setRawApiResponse(data.rawResponse ?? null);
            setViewStep("result");
            return;
          }

          // queued or in_progress
          setJobStatus(data.status);
          setErrorMessage(null);
        } catch {
          // 일시적인 연결 끊김: 작업은 계속 확인하고, 화면에는 알림만 띄운다.
          setErrorMessage("연결이 잠깐 끊겼어요. 계속 확인하고 있어요.");
        }
      };

      // Trigger first check after 1.5s, then every POLL_INTERVAL_MS
      pollTimerRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);
    },
    [clearTimers]
  );

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage("PDF를 먼저 올리거나 아래 샘플을 골라 주세요.");
      return;
    }

    clearTimers();
    setErrorMessage(null);
    setVerificationResult(null);
    setRawApiResponse(null);
    setCitationFocus(null);
    setElapsedSeconds(0);
    setFileId(null);
    setJobStatus("uploading");
    setViewStep("analyzing");
    startElapsedTimer();

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as CreateVerifyApiResponse & {
        error?: string;
      };

      if (!response.ok || !data.jobId) {
        clearTimers();
        setJobStatus("failed");
        setErrorMessage(
          data.error ||
            `문서를 보내지 못했어요. 다시 시도해 주세요. (오류 코드 ${response.status})`
        );
        return;
      }

      setFileId(data.fileId);
      setJobStatus(data.status === "in_progress" ? "in_progress" : "queued");

      startPollingJob(data.jobId, data.fileId);
    } catch {
      clearTimers();
      setJobStatus("failed");
      setErrorMessage(
        "서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요."
      );
    }
  };

  const handleResetToUpload = () => {
    clearTimers();
    setViewStep("upload");
    setJobStatus("uploading");
    setFileId(null);
    setErrorMessage(null);
    setVerificationResult(null);
    setRawApiResponse(null);
    setCitationFocus(null);
  };

  const handleLeaveAnalysis = () => {
    const isRunning = viewStep === "analyzing" && jobStatus !== "failed";
    if (
      isRunning &&
      !window.confirm("분석을 그만두고 문서 고르기로 돌아갈까요? 지금 분석 결과는 받을 수 없어요.")
    ) {
      return;
    }
    handleResetToUpload();
  };

  return (
    <main className="flex-1 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Sub-navigation bar when in Analyzing or Result step */}
        {viewStep !== "upload" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 no-print">
            <button
              type="button"
              onClick={handleLeaveAnalysis}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span>다른 문서 고르기</span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
              <FileText className="h-4 w-4 text-pine" aria-hidden />
              {selectedFile?.name}
            </span>
          </div>
        )}

        {/* STEP 1: PDF Upload View */}
        {viewStep === "upload" && (
          <PdfUploadPanel
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onStartAnalysis={handleStartAnalysis}
            isSubmitting={false}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        )}

        {/* STEP 2: Analysis Progress View */}
        {viewStep === "analyzing" && (
          <AnalysisProgressPanel
            status={jobStatus}
            elapsedSeconds={elapsedSeconds}
            errorMessage={errorMessage}
            onRetry={handleStartAnalysis}
            onCancelOrReset={handleResetToUpload}
          />
        )}

        {/* STEP 3: Verification Result View (2-Column Desktop Split Layout) */}
        {viewStep === "result" && verificationResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left Column: Original PDF Document Viewer */}
              <div ref={viewerRef} className="lg:col-span-6 lg:sticky lg:top-20 scroll-mt-20 no-print">
                <PdfDocumentViewer
                  file={selectedFile}
                  segments={verificationResult.documentSegments}
                  focus={citationFocus}
                />
              </div>

              {/* Right Column: AI Historical Verification Report */}
              <div className="lg:col-span-6 print-full-width">
                <VerificationResultCard
                  result={verificationResult}
                  rawResponse={rawApiResponse}
                  fileName={selectedFile?.name || "document.pdf"}
                  showDebug={debugParam}
                  onCitationSelect={handleCitationSelect}
                  activeCitationIndex={citationFocus?.citation.index ?? null}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-hanji text-ink">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12 text-sm text-ink-muted">
            화면을 준비하고 있어요
          </div>
        }
      >
        <VerifyWorkspaceContent />
      </Suspense>
      <Footer />
    </div>
  );
}
