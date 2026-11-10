import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SampleCaseList } from "@/components/samples/SampleCaseList";
import { ArrowRight, ShieldAlert } from "lucide-react";

const FEATURES = [
  {
    title: "모르면 검토 필요로 넘겨요",
    body: "사료가 없거나 읽을 수 없으면 일치나 충돌을 짐작하지 않고 사람에게 맡겨요.",
  },
  {
    title: "근거를 원문 위에서 짚어요",
    body: "판정 근거의 쪽 번호를 누르면 PDF에서 그 자리를 바로 보여 줘요.",
  },
  {
    title: "섞인 문서를 알아서 나눠요",
    body: "대본, 사료, 검토 요청서를 PDF 하나로 올려도 각각 나눠 읽어요.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-hanji text-ink break-keep">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-5">
                  <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-ink text-balance sm:text-5xl sm:leading-[1.22]">
                    사극의 한 장면,
                    <br />
                    <span className="text-pine">역사의 기록</span>으로 검증하다.
                  </h1>
                  <p className="max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
                    대본과 사료를 PDF 하나로 올리면 장면이 기록과 맞는지 판정하고, 그 근거가 원문 어디에 있는지 보여 줘요.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link
                    href="/verify"
                    className="inline-flex items-center justify-center gap-2.5 rounded-sm bg-pine px-7 py-4 text-base font-semibold text-white shadow-archive transition-colors hover:bg-pine-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-hanji"
                  >
                    <span>검수 시작하기</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="#samples"
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-border-strong bg-hanji-card px-6 py-4 text-sm font-medium text-ink transition-colors hover:bg-hanji-dark/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-hanji"
                  >
                    샘플로 먼저 해 보기
                  </Link>
                </div>
              </div>

              {/* Example record: set02 (SC-002). Script and source lines are from the PDF, reason is the answer sheet's. */}
              <div className="lg:col-span-5">
                <figure className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 sm:p-7 shadow-archive-md">
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-cinnabar/40 bg-cinnabar/10 font-serif text-xs font-bold text-cinnabar"
                      >
                        檢
                      </span>
                      <figcaption>
                        <p className="text-xs text-ink-muted">판정 예시</p>
                        <p className="font-serif text-base font-bold text-ink">
                          SC-002 최만리의 상소
                        </p>
                      </figcaption>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-cinnabar/40 bg-cinnabar-light px-3 py-1 text-xs font-bold text-cinnabar">
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      충돌
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm leading-relaxed">
                    <div className="rounded-sm bg-hanji/70 p-4">
                      <p className="mb-1.5 flex justify-between gap-3 text-xs text-ink-muted">
                        <span>대본 1쪽</span>
                        <span>세종 26년 2월</span>
                      </p>
                      <p className="font-serif text-ink">
                        최만리: “나는 다른 신하들과 함께 새 언문의 제작을{" "}
                        <span className="underline decoration-cinnabar decoration-2 underline-offset-4 font-semibold">
                          적극 찬성하는 상소
                        </span>
                        를 왕께 올렸네.”
                      </p>
                    </div>

                    <div className="rounded-sm bg-hanji/70 p-4">
                      <p className="mb-1.5 flex justify-between gap-3 text-xs text-ink-muted">
                        <span>사료 4쪽, 세종실록 103권</span>
                        <span>세종 26년 2월 20일</span>
                      </p>
                      <p className="font-serif text-ink">
                        집현전 부제학 최만리 등이{" "}
                        <span className="underline decoration-pine decoration-2 underline-offset-4 font-semibold">
                          언문 제작의 부당함
                        </span>
                        을 아뢰다
                      </p>
                    </div>

                    <div className="rounded-sm bg-cinnabar-light/60 p-4">
                      <p className="mb-1.5 text-xs font-semibold text-cinnabar">판정 근거</p>
                      <p className="text-ink">
                        대본은 최만리 등이 새 언문의 제작에 적극 찬성하는 상소를 제출했다고 한다. 사료에서는 최만리 등이 언문 제작의 부당함을 주장하며 반대 상소를 제출했으므로 같은 상소의 입장이 모순된다.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end border-t border-border pt-4">
                    <Link
                      href="/verify?sample=set02"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 focus-visible:ring-offset-hanji-card"
                    >
                      이 장면 직접 돌려 보기
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* What sets it apart */}
        <section id="about" aria-label="사극체크의 특징" className="scroll-mt-16 border-b border-border py-12 sm:py-16">
          <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border lg:px-8">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <h2 className="font-serif text-lg font-bold text-ink">{feature.title}</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Final dataset cases (set01 ~ set18) */}
        <section id="samples" className="scroll-mt-16 py-16 sm:py-20 bg-hanji-dark/25">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-ink">
                  준비된 장면 18개로 해 보기
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                  정통 사극과 퓨전 사극 대본에 실록 기사를 바탕으로 한 사료를 묶었어요. 사료가 빠졌거나 훼손된 장면도 있어요. 묶음 이름은 미리 정해 둔 정답이에요.
                </p>
              </div>
              <Link
                href="/verify"
                className="inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2.5 text-sm font-semibold text-white hover:bg-pine-hover shrink-0 self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
              >
                <span>내 PDF 올리기</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-10">
              <SampleCaseList mode="link" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
