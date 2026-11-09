import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SAMPLE_DATASETS } from "@/lib/sample-datasets";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileSearch,
  FileText,
  Scale,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Layers,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-hanji text-ink">
      <Header />

      <main className="flex-1">
        {/* A. Hero Section */}
        <section className="relative overflow-hidden border-b border-border py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Editorial Typography & Main CTA */}
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center gap-2 rounded-sm border border-border-strong/60 bg-hanji-card px-3 py-1.5 text-xs font-medium text-ink-muted shadow-archive">
                  <span className="h-2 w-2 rounded-full bg-cinnabar" />
                  <span>조선왕조실록 등 문헌 사료 기반 · AI 역사 고증 1차 검수</span>
                </div>

                <div className="space-y-4">
                  <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-ink sm:text-5xl sm:leading-[1.22]">
                    사극의 한 장면,
                    <br />
                    <span className="text-pine">역사의 기록</span>으로 검증하다.
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
                    사극 대본과 역사 사료를 AI가 대조하여, 근거에 기반한 역사 고증 검수 결과를 제공합니다.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link
                    href="/verify"
                    className="inline-flex items-center justify-center gap-2.5 rounded-sm bg-pine px-7 py-4 text-base font-semibold text-white shadow-archive transition-all hover:bg-pine-hover focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
                  >
                    <span>역사 고증 시작하기</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-border-strong bg-hanji-card px-6 py-4 text-sm font-medium text-ink transition-colors hover:bg-hanji-dark/60"
                  >
                    <span>검수 방식 자세히 보기</span>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-border pt-6 text-xs text-ink-muted">
                  <div>
                    <div className="font-serif text-sm font-bold text-ink">
                      문헌 분리·추출
                    </div>
                    <div className="mt-0.5">대본·사료·요청서 자동 분류</div>
                  </div>
                  <div>
                    <div className="font-serif text-sm font-bold text-ink">
                      실록 사료 대조
                    </div>
                    <div className="mt-0.5">연도·인물·사건 사실관계 검증</div>
                  </div>
                  <div>
                    <div className="font-serif text-sm font-bold text-ink">
                      3단계 명확한 판정
                    </div>
                    <div className="mt-0.5">일치 · 충돌 · 검토 필요</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Historical Manuscript + Modern Analysis Visual Card */}
              <div className="lg:col-span-5">
                <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 sm:p-7 shadow-archive-md">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-cinnabar/40 bg-cinnabar/10 font-serif text-xs font-bold text-cinnabar">
                        檢
                      </span>
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
                          고증 검수 기록표 예시
                        </p>
                        <h2 className="font-serif text-base font-bold text-ink">
                          SC-002 · 역사 고증 검수
                        </h2>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-sm border border-cinnabar/40 bg-cinnabar-light px-3 py-1 text-xs font-bold text-cinnabar">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      충돌
                    </span>
                  </div>

                  {/* Comparison snippet */}
                  <div className="mt-5 space-y-4 text-xs leading-relaxed">
                    <div className="rounded-sm border border-border bg-hanji/60 p-3.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted mb-1">
                        <span>[사극 촬영 대본] 제2화 · SC-002</span>
                        <span>세종 26년 2월</span>
                      </div>
                      <p className="font-serif text-ink">
                        “나는 다른 신하들과 함께 새 언문의 제작을{" "}
                        <span className="underline decoration-cinnabar decoration-2 underline-offset-4 font-semibold">
                          적극 찬성하는 상소
                        </span>
                        를 왕께 올렸네.” — 최만리
                      </p>
                    </div>

                    <div className="rounded-sm border border-border bg-hanji/60 p-3.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted mb-1">
                        <span>[역사 사료] 세종실록 103권</span>
                        <span>세종 26년 2월 20일</span>
                      </div>
                      <p className="font-serif text-ink">
                        ○庚子/集賢殿副提學崔萬理等上疏曰… 집현전 부제학 최만리 등이{" "}
                        <span className="underline decoration-pine decoration-2 underline-offset-4 font-semibold">
                          언문 제작의 부당함을 아뢰는 상소
                        </span>
                        를 올렸다.
                      </p>
                    </div>

                    <div className="rounded-sm border border-cinnabar/30 bg-cinnabar-light/50 p-3.5">
                      <div className="font-semibold text-cinnabar mb-1">
                        AI 판정 근거 및 검토 권고
                      </div>
                      <p className="text-ink">
                        대본은 최만리가 언문 제작에 적극 찬성하는 상소를 올렸다고 서술하지만, 제공된 『세종실록』 103권에는 언문 제작의 문제점을 제기하는 상소를 제출했다고 기록되어 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-[11px] text-ink-muted">
                    <span>Upstage Studio Workflow: Parse → Split → Extract → Merge → Instruct</span>
                    <Link
                      href="/verify?sample=set02"
                      className="font-semibold text-pine hover:underline shrink-0 ml-2"
                    >
                      이 사례 직접 실행 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (3 Steps + Upstage Workflow) */}
        <section
          id="how-it-works"
          className="border-b border-border bg-hanji-dark/35 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-widest text-pine uppercase">
                HOW IT WORKS · 사용 방법 및 검수 절차
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-ink sm:text-3xl">
                세 단계로 완성되는 AI 역사 고증 검수
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
                사극 대본과 역사 사료가 결합된 문서를 업로드하면, Upstage Studio에 구축된 전용 문서 분석 파이프라인이 실행됩니다.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 shadow-archive">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl font-bold text-pine/80">
                    01
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-pine-light text-pine">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-ink">
                  대본 및 역사 사료 업로드
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  검토할 사극 촬영 대본과 대조 대상 역사 사료(조선왕조실록 원문·국역본 및 고증 검토 요청서)가 수록된 PDF 문서를 업로드합니다.
                </p>
                <div className="mt-4 border-t border-border pt-3 text-xs text-ink-light">
                  지원 형식: PDF (최대 500MB · 스캔본 포함)
                </div>
              </div>

              {/* Step 2 */}
              <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 shadow-archive">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl font-bold text-pine/80">
                    02
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-pine-light text-pine">
                    <FileSearch className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-ink">
                  AI 문서 분석 및 역사적 근거 대조
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  Upstage Studio 워크플로우(Parse → Classify → Extract → Merge → Instruct)가 문서 내 대본과 사료를 자동 분리하고 역사적 주장과 실록 근거를 추출·통합합니다.
                </p>
                <div className="mt-4 border-t border-border pt-3 text-xs text-ink-light">
                  Upstage Studio Agents API 실시간 연동
                </div>
              </div>

              {/* Step 3 */}
              <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 shadow-archive">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-2xl font-bold text-pine/80">
                    03
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-pine-light text-pine">
                    <Scale className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-ink">
                  고증 검수 보고서 확인
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  원본 PDF 문서 뷰어와 나란히 최종 판정(일치 / 충돌 / 검토 필요), 판정 근거, 역사 사료 출처, 누락 문서 여부 및 검토 권고안을 확인하고 인쇄·저장합니다.
                </p>
                <div className="mt-4 border-t border-border pt-3 text-xs text-ink-light">
                  좌우 2단 대조 뷰어 · 결과 복사 및 PDF 인쇄 지원
                </div>
              </div>
            </div>

            {/* Workflow pipeline banner */}
            <div className="mt-10 rounded-sm border border-border bg-hanji-card p-5 sm:p-6 shadow-archive">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-pine shrink-0" />
                  <div>
                    <h4 className="font-serif text-sm font-bold text-ink">
                      Upstage Studio 검증 워크플로우 파이프라인
                    </h4>
                    <p className="text-xs text-ink-muted">
                      웹 서버에서 임의 재구현하지 않고 Upstage Studio에 정의된 공식 Agent 워크플로우를 직접 호출합니다.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="rounded-sm border border-border bg-hanji px-3 py-1.5 text-ink">
                    1. Parse (문서/스캔 인식)
                  </span>
                  <span className="text-ink-light">→</span>
                  <span className="rounded-sm border border-border bg-hanji px-3 py-1.5 text-ink">
                    2. Classify (대본·사료·요청서 분리)
                  </span>
                  <span className="text-ink-light">→</span>
                  <span className="rounded-sm border border-border bg-hanji px-3 py-1.5 text-ink">
                    3. Extract (주장·근거 추출)
                  </span>
                  <span className="text-ink-light">→</span>
                  <span className="rounded-sm border border-border bg-hanji px-3 py-1.5 text-ink">
                    4. Merge (결과 통합)
                  </span>
                  <span className="text-ink-light">→</span>
                  <span className="rounded-sm border border-pine/40 bg-pine-light px-3 py-1.5 font-semibold text-pine">
                    5. Instruct (최종 고증 판정)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E. Service Introduction Section: "사극체크는 어떻게 역사를 검증하나요?" */}
        <section id="about" className="border-b border-border py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-xs font-semibold tracking-widest text-cinnabar uppercase">
                  VERIFICATION PRINCIPLE · 고증 원칙
                </p>
                <h2 className="font-serif text-2xl font-bold leading-snug text-ink sm:text-3xl">
                  사극체크는 어떻게
                  <br />
                  역사를 검증하나요?
                </h2>
                <p className="text-sm leading-relaxed text-ink-muted sm:text-base">
                  사극 제작 과정에서 대본 속 인물, 사건, 날짜, 정책 등을 실록 등 사료와 일일이 대조하는 작업은 많은 시간이 소요됩니다. 사극체크는 AI가 임의의 지식을 지어내지 않도록 제출된 사료에 엄격히 기반하여 1차 고증 검수를 수행합니다.
                </p>

                {/* Important Notice Box */}
                <div className="mt-6 rounded-sm border border-ochre-border bg-ochre-light p-4 text-xs leading-relaxed text-ink">
                  <div className="flex items-center gap-2 font-semibold text-ochre mb-1">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>고증 검수 활용 안내</span>
                  </div>
                  <p>
                    본 서비스는 역사 고증을 지원하는 AI 기반 1차 검수 도구로, 최종적인 역사적 해석과 판단에는 전문가 검토가 필요할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-sm border border-border bg-hanji-card p-6 shadow-archive">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-pine-light text-pine">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-serif text-base font-bold text-ink">
                    제공된 역사 사료에 기반한 사실관계 비교
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                    외부의 불확실한 추측을 배제하고, 문서에 함께 제출된 『조선왕조실록』 등 원문·국역 사료를 기준으로 사실관계 부합 여부를 엄밀히 대조합니다.
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-hanji-card p-6 shadow-archive">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-pine-light text-pine">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-serif text-base font-bold text-ink">
                    대본 속 역사적 주장 자동 추출
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                    창작 대본의 대사와 지문 속에 포함된 시대 배경(연도·월·일), 실존 인물의 행적, 왕명 및 역사적 사건에 대한 핵심 주장을 구조화하여 추출합니다.
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-hanji-card p-6 shadow-archive">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-ochre-light text-ochre">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-serif text-base font-bold text-ink">
                    근거가 부족한 경우 ‘검토 필요’ 판정
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                    스캔 상태 불량으로 원문 판독이 불가능하거나, 사료에 해당 사실이 명시되지 않은 경우 억지로 ‘일치’나 ‘충돌’을 단정하지 않고 ‘검토 필요’로 분류합니다.
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-hanji-card p-6 shadow-archive">
                  <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-cinnabar-light text-cinnabar">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-serif text-base font-bold text-ink">
                    사료의 부재와 역사적 오류를 구분
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                    실록 기록과 명백히 모순되는 역사적 오류(충돌)와 대조할 사료 자체가 누락된 경우(누락 문서 안내 및 검토 필요)를 명확히 구분하여 보고합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Datasets Quick Launch Section (set01 ~ set05) */}
        <section className="py-16 sm:py-20 bg-hanji-dark/25">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-pine uppercase">
                  VERIFICATION TEST CASES · 검증 데이터셋 (Set 01 ~ Set 05)
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-ink">
                  사극 『백성의 글자』 장면별 고증 검수 테스트셋
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  준비된 5종의 테스트 PDF(대본+사료 결합 문서)를 선택하여 실제 Upstage Studio API 워크플로우의 판정 결과를 즉시 검증해 보세요.
                </p>
              </div>
              <Link
                href="/verify"
                className="inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2.5 text-xs font-semibold text-white hover:bg-pine-hover shrink-0"
              >
                <span>직접 PDF 업로드하기</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {SAMPLE_DATASETS.map((item) => (
                <Link
                  key={item.id}
                  href={`/verify?sample=${item.id}`}
                  className="group flex flex-col justify-between rounded-sm border border-border bg-hanji-card p-4 shadow-archive transition-all hover:border-pine hover:shadow-archive-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-pine">
                        {item.code}
                      </span>
                      <span className="rounded-sm bg-hanji px-2 py-0.5 text-[11px] text-ink-muted border border-border">
                        {item.pages}쪽
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-serif text-sm font-bold text-ink group-hover:text-pine">
                      {item.episode}
                    </h3>
                    <p className="mt-1 text-[11px] text-ink-light">{item.era}</p>
                    <p className="mt-2.5 text-xs leading-relaxed text-ink-muted line-clamp-3">
                      {item.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-pine">
                    <span>검수 페이지에서 불러오기</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
