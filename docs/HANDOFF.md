# 작업 인수인계

다음 세션이 이어서 작업할 수 있도록 현재 상태를 정리한다. 작업을 이어가면 이 문서를 갱신한다.

- 마지막 갱신: 2026-11-10 (화면 문구 정리: 진행 화면, 결과 화면)
- **최종 제출 마감: 2026-11-10(화) 17시, 구글폼**

## 1. 지금까지 한 일

| 커밋 | 내용 |
|---|---|
| `8a09db4` | `AGENTS.md`, `CLAUDE.md`(→ `@AGENTS.md`), `docs/EVALUATION.md` 추가 |
| `37ae527` | `docs/SUBMISSION.md`(제출 가이드 · 피드백 요약), `docs/MISSION2_REVIEW.md` 추가 |
| `28d1892` | 서비스의 모든 Upstage 요청에 `x-project-id` 헤더 추가 (`UPSTAGE_PROJECT_ID`) |
| `5109afd` | 정답지 자동 대조 스크립트 `npm run verify:answers`, `docs/VERIFY.md`, `docs/UPSTAGE_API.md`, `data/mission2/` |
| `24a29ea`, `4a2f4ce` | `docs/FINAL_REVIEW.md`, 이 문서, `data/final/` PDF 15개와 정답지 |
| `9109d4d` | set03 6쪽 평가 관련 문구 삭제 (#3) |
| `23acf74` | 최종 15건 실행 결과(v6) 문서 반영 |

- GitHub 이슈 #1~#14 등록 (선후행 순서대로, 번호 = 진행 순서). 계획 전체는 이슈 본문 참고.
- 이슈 댓글: #1(출력 형식 비교 근거 2건), #5(사료 누락 감지 버그), #11(서비스 헤더 수정 · 실행 확인)

## 2. 저장소에 없는 것

- `.env` (`.gitignore` 대상): `UPSTAGE_AGENT_ID=agt_bRU6jFjmhXuXGi8KLZucvp`, `UPSTAGE_CONFIG_ID=4`, `UPSTAGE_PROJECT_ID=proj_ReKt96vC6hC894rMxHpYih`
- `verify-reports/` (`.gitignore` 대상): `final-config6`, `final-new-config2~4`, `fusion-config4` 등 실행 리포트
- Windows 다운로드 표시 파일(`*:Zone.Identifier`)은 `.gitignore`로 제외한다.

## 3. 현재 상태 요약

- **최종 워크플로우: `최종_사극체크` (`agt_bRU6jFjmhXuXGi8KLZucvp`) config 4.** v6 JSON을 새 프로젝트에 가져와 만들었고, 판정 프롬프트의 `source_reference` 줄만 고쳤다. 이전 에이전트 2개는 쓰지 않는다. 상세는 [`FINAL_REVIEW.md`](FINAL_REVIEW.md) 8절.
- 데이터셋: `data/final/` 18케이스(set01~18), 문서 39건. 퓨전 사극 P · Q · R(set16~18)을 추가했다. 사전 점검 통과.
- config 4 실행 결과
  - set01~15 2회: `scene_id` · `decision` · `missing_documents` 15/15, `source_reference` 14/15 (J만 불일치, 팀 결정으로 그대로 둠)
  - set16~18 2회: 6/6 일치
  - 오류 · 시간초과 0건
- set03은 평가 문구를 지운 수정본이고, 새 프로젝트에도 수정본이 올라가 있다.
- 사이트(Studio)에서 돌린 실행 결과는 API로 목록 조회가 안 된다(`GET /v2/responses` → 405). job ID를 알면 `GET /v2/responses/{job_id}`로 가져올 수 있다. config 목록을 조회하는 API도 없다. 없는 config 번호로 실행하면 404가 난다.

## 4. 다음에 할 일 (순서대로, 마감 11/10 17시)

1. (완료) Studio 화면에서 config 4로 set01~18 실행, 18건 모두 완료
2. (완료) config 4 워크플로우 JSON → `submission/경크크_최종제출_workflow.json` (에이전트 `agt_bRU6…`, `configVer: 4` 확인) (#9)
3. (승인 요청 완료, 승인 대기) 라이브러리 게시 (#8)
   - 게시 링크: https://studio.upstage.ai/library/agt_n4okqmTqvFUNDbFVyrMuZW (게시용 사본 ID라 원래 에이전트 ID와 다름)
   - 승인 전에는 미리보기가 404로 뜬다. 승인 알림이 오면 페이지가 열리는지, 설정 버전 4, 샘플 18개인지 확인
   - 이름 `최종_사극체크`. 설명은 자동 생성 문구가 set14 한 건만 보고 쓴 것이라 실제 동작에 맞게 바꿨다
4. (완료) 유형표 39줄, 설계서 세 곳 수정 → `submission/` (#6, #10). 머리글도 `최종 설계서` / `v4 설계서`로 수정함. 남은 선택: 한계 문구(J, 기사 ID 없는 자료)를 2쪽에 넣을지
4-1. (완료) 유형표 ③ 문서 결합 보완: Q&A 공지상 결합 PDF는 모든 줄에 "③ 문서 결합"을 적어야 한다. 26줄 수정함 ([`FINAL_REVIEW.md`](FINAL_REVIEW.md) 10절)
5. 산출물 파일 이름을 `경크크_최종제출_*`로 맞추고 데모 영상 · 발표 자료 준비, 구글폼 제출 (#12~#14)
5-1. 웹 서비스를 최종 워크플로우 · 데이터셋에 맞추기 (#11). 데모는 Vercel 배포를 검토 중. 상세는 6절

6. 프롬프트를 다시 고치면 config 번호가 바뀐다 → `.env` 갱신 → 전체 재실행 → 게시 · 내보내기는 그 config로
7. 제출 후: [`FINAL_REVIEW.md`](FINAL_REVIEW.md) 9절 후속 설계 과제

## 5. 참고

- 작업 규칙: [`AGENTS.md`](../AGENTS.md) (커밋 형식 `<type>: <한국어 요약>`, `Co-authored-by` 금지, API 키 직접 기재 금지)
- 1건 실행 시간 약 20초~5분(동시 실행 시 앞쪽이 대기열 때문에 길어짐), 토큰 건당 약 7,000~62,000
- 스크립트의 실행 요청 타임아웃은 120초(서비스 기본 30초). 30초에서는 동시 실행 중 끊기는 일이 있었다.
- `.env`가 CRLF 줄바꿈이다. 스크립트 · 서비스는 값을 trim해서 문제없지만, 셸에서 `source .env` 하면 `\r`이 섞인다.

## 6. 웹 서비스 (#11, 데모용)

### 한 것 (UI 파일은 건드리지 않음)
- `public/samples/`: 미션 2 샘플 5개를 지우고 `data/final/` PDF 18개를 `set01.pdf` ~ `set18.pdf`로 복사 (내용 동일, cmp 확인)
- `src/lib/sample-datasets.ts`: 18케이스. `caseId` · `code` · `expectedDecision` · `documents`는 정답지 값, 제목 · 시대는 각 PDF 1쪽 머리말에서 옮김
- `src/lib/upstage.ts`, `.env.example`: 기본값을 `agt_bRU6jFjmhXuXGi8KLZucvp` / config `4`로. 실행 요청 타임아웃 30초 → 120초
- `src/lib/result-parser.ts`, `src/types/verification.ts`: 응답의 `additional_values.citations`(인용 `【†n】`별 쪽 · 좌표 · 근거 추출 항목)와 `merge.items`(Classify가 나눈 문서 종류별 쪽 범위)를 `citations` · `documentSegments`로, `【†n】`를 남긴 키별 원문을 `annotatedFields`로 함께 반환. 값은 응답 그대로 옮기고 추론하지 않는다
  - config 4 실행 결과 36건(`verify-reports/final-new-config4`, `fusion-config4`)으로 확인: 판정 · scene_id · missing_documents 36/36 정답과 같음, 본문의 `【†n】` 번호는 모두 `citations`에 있음, 36건 모두 `merge` 있음
  - `citations.page`는 업로드한 PDF 기준 1부터 시작. 좌표는 쪽 크기 대비 0~1 값(왼쪽 위 기준). `source_type`은 `extract`(추출 항목 경로) 또는 `parse`(Parse 요소 번호)
- `README.md`, `AGENTS.md`, `data/README.md`의 샘플 설명을 최종 데이터셋 기준으로 수정
- `npm run build` 통과. `npm run lint`는 저장소에 ESLint 설정이 없어 대화형 설정 질문에서 멈춤(실행 안 됨, 기존부터 그랬음)

### 화면 작업 (2026-11-10, 제품 정의는 `PRODUCT.md`)
- 결과 화면: 판정 근거 · 사료 출처의 `【†n】` 자리에 "N쪽" 버튼. 누르면 왼쪽 뷰어가 그 쪽으로 이동하고 근거 구간에 먹색 테두리(`근거 n`)를 그린다. 모바일에서는 뷰어로 스크롤한다
- 뷰어 쪽 번호 줄을 문서별로 묶음: `[대본 1 2] [사료 3] [요청서 6]` (`documentSegments`). 분류되지 않은 쪽은 "분류 안 됨"
- 샘플 목록(`src/components/samples/SampleCaseList.tsx`): 18케이스를 기대 판정별 세 묶음으로. 업로드 화면과 메인 페이지에서 같이 씀. 샘플 파일 이름은 `경크크_최종제출_setNN.pdf`
- 확인: config 4 저장 응답 5건(P · Q · L · E · C)을 API 대신 넣어 1440px · 390px 화면 캡처. 실제 API 호출 상태에서는 아직 안 돌려 봄
- 남은 것: 헤더 메뉴가 모바일에서 글자 중간에 줄바꿈됨(`Header.tsx`, 기존 문제). 같은 쪽의 근거가 여러 개면 버튼 글자가 같아 구분이 어려움(예: L의 "2쪽" 2개)
- 파서가 판정을 추측해 채우는 부분 검토 (아직 안 함): 판정 값이 없으면 `검토 필요`로 채움, `불일치` 글자가 있으면 `충돌`로 바꿈. 화면에서는 "결과를 읽지 못함"으로 표시하는 편이 AGENTS.md 예외 처리 규칙에 맞음

### 화면 문구 정리 (2026-11-10, 브랜치 `feat/ui-copy-cleanup`)

사용자 지적: "AI 티가 너무 난다. 문구가 너무 많고 너무 많이 담으려 한다." 화면을 하나씩 고치는 중이다.

**문구 규칙 (사용자 확정)**
- 말투는 ~해요체. 중간점(·)과 em-dash(—)는 쓰지 않는다
- 한 상태에 한 문장. 화면이 이미 보여 주는 것을 다시 설명하지 않는다
- 영문 개발 용어(queued, Job ID, 노드 이름, POST ...)는 사용자 화면에 넣지 않는다
- 코드가 판단 문장을 만들지 않는다(`docs/EVALUATION.md` 82줄: 조건 판단은 Studio 노드, 외부 코드는 저장 · 표시 · 알림만)

**평가 기록:** `.impeccable/critique/2026-11-09T19-27-37Z__src-app.md` (gitignore 대상, 로컬에만 있음). 시작 점수 21/40. 우선순위 문제 5개와 화면별 삭제 목록이 들어 있다.

**한 것**
1. 진행 화면 (`AnalysisProgressPanel.tsx`, `verify/page.tsx`)
   - 사실이 아닌 문구 삭제("무결성 검증, 세션 스토리지")
   - 대기 시간 안내를 실행 기록(18~325초, 절반쯤은 30초 안)에 맞춰 "짧으면 20초, 길면 5분쯤 걸려요"로
   - 세로 흐름: PDF 올리기 → 분석 순서 기다리기 → 워크플로우 실행 → 결과 보기. 워크플로우 실행 안에 실제 노드 순서(문서 나누기 = Parse·Classify, 주장과 기록 찾기 = Extract, 판정 내리기 = Instruct)를 보여 주되, API가 노드별 진행을 알려 주지 않으므로 하위 단계에는 체크 표시를 하지 않는다
   - 움직이는 표시는 지금 단계 표시 하나만(위아래 스피너 두 개였던 것 정리). 지난 시간은 오른쪽 위
   - 지난 시간을 "분석 시작"을 누른 순간부터 셈(전에는 업로드가 끝난 뒤 0초부터 다시 셌음). 시간 초과 300초는 그대로 실행 요청이 끝난 뒤부터 잼
   - 상태 문구에 `aria-live`. 조회가 한 번 실패하면 "연결이 잠깐 끊겼어요" 알림, 다음 조회가 되면 사라짐
   - 분석 중 "다른 문서 고르기"를 누르면 확인 창. 오류 문구 6개 해요체로. Job ID 표시 삭제
2. 결과 화면 (`VerificationResultCard.tsx`, `verify/page.tsx`, `result-parser.ts`)
   - 처음에 너무 줄였다는 사용자 의견("출처, 판정 근거가 너무 단순해졌다", "기존이 조금 더 낫다")을 받아 섹션 구조를 되살림: 아이콘 소제목(판정 근거, 사료 출처, 빠진 문서) + 바탕색 영역. 상자 안 상자가 되지 않게 안쪽 영역은 테두리 없이 바탕색만
   - 머리: 판정 배지(크게) + 장면 ID, 그 아래 판정 뜻 한 줄(일치: 사료 기록과 맞아요 / 충돌: 달라요 / 검토 필요: 첨부한 문서만으로는 판단할 수 없어요. 사람이 확인해 주세요). 판정 값의 뜻일 뿐 사유를 지어내지 않음
   - 빠진 문서: 없으면 "없어요. 대본과 사료를 모두 찾았어요.", 있으면 황토 영역에 문서 이름
   - 계속 삭제한 것: 메타 박스, 4. 검토 권고(화면, 복사 텍스트, `getVerificationRecommendation`), 면책 문단, 상단 배너, ※ 출처 주석, 카드 안 "다른 문서 분석" 버튼, 섹션 번호
   - 디버그(원본 응답)는 `/verify?debug=1`일 때만 보임

**확인:** `npm run build` 통과, `tsc` 통과, impeccable 탐지기 0건. API 응답 대신 저장 응답(`set03`, `05`, `12`, `16`, `17`)을 넣어 1440px · 390px 화면 캡처로 확인. 실제 API로는 아직 안 돌려 봄.

**다음에 할 일 (순서대로, 한 화면씩)**
1. (완료, 브랜치 `feat/landing-distill`) `/` 랜딩 distill: 히어로 + 차별점 3줄 + 샘플 목록만 남김. 상단 알약, 숫자 3칸, "사용 방법" 섹션, "어떻게 검증하나요" 섹션, 면책 박스, 예시 카드의 워크플로우 줄(Split 표기) 삭제
   - 예시 카드(set02): 대본 대사(1쪽)와 사료 기사명(4쪽)은 PDF 원문, 판정 근거는 정답지 `reason` 그대로. 머리에 "판정 예시"
   - 차별점 3줄은 PRODUCT.md Positioning 세 가지를 해요체 한 문장씩으로. 섹션 id는 `about`(차별점), `samples`(샘플)
   - 헤더 · 푸터의 `/#how-it-works` 링크는 섹션이 없어져 `/#samples`로 바꾸고 이름을 "샘플 보기"로. 나머지 헤더 · 푸터 문구는 2번에서
   - 랜딩 전체에 `break-keep`(단어 단위 줄바꿈). 1440px · 390px 캡처, 가로 넘침 없음, 탐지기 0건
2. (완료, 브랜치 `feat/upload-clarify`) 업로드 화면 + 헤더 + 푸터 clarify
   - 업로드(`PdfUploadPanel.tsx`): 위쪽 라벨, 워크플로우 연동 안내 박스, "문서 형식" 줄, "최대 1,000페이지"(코드가 확인 안 함) 삭제. 제목 "검수할 PDF를 올려 주세요.", 버튼 "판정 시작", 오류 상자는 제목 없이 한 문장
   - 오류 문구 해요체: 업로드 화면 6개, 서버 응답(`api/verify`, `api/jobs/[id]`, `lib/upstage.ts`) 20개. `result-parser.ts`의 대체 문구 1개는 파서라 그대로 둠
   - 헤더: 부제 삭제, 메뉴 "소개 / 샘플" + 버튼 "검수 시작"(모든 화면, `/verify`에서는 현재 위치 표시). `|` 구분선 삭제. 390px에서 한 줄
   - 푸터: 설명 한 줄, 면책 문구 삭제, 링크 이름을 헤더와 같게. "Powered by" 줄은 그대로
   - 샘플 목록: 중간점을 쉼표와 간격으로. `sample-datasets.ts` 제목 18개의 " · 제N화"를 " 제N화"로(장면 이름 안의 "최항 · 박팽년" 같은 나열은 그대로)
   - 1440px · 390px 캡처(빈 상태 오류, 파일 고른 상태, 헤더), 가로 넘침 없음, 탐지기 0건
3. audit: `ink-light #868C81` 대비 3.0~3.5:1(4.5 미만, `#6F756A` 정도로), 황토 작은 글자 3.8~4.3:1, 근거 칩 높이 약 18px(최소 24px), 10~11px 글자
4. polish 후 `/impeccable critique` 다시 실행해 점수 비교

**정할 것 (사용자 확인 필요)**
- 시간 초과 300초(`verify/page.tsx` `MAX_POLL_TIME_SECONDS`)인데 실행 기록에 325초가 있음(5건 동시 실행 때). 420초 정도로 늘릴지. 늘리면 진행 화면 "길면 5분쯤"도 맞춘다
- `검토 필요`의 황토색 + 삼각형 경고 아이콘이 "실패"처럼 보임(PRODUCT.md 원칙 2와 어긋남). 중립 톤으로 바꿀지
- 뷰어 툴바 버튼이 8개(이전, 다음, 축소, 배율, 확대, 초기화, 전체 쪽 보기, 기본 뷰어). 줄일지

### Vercel 배포 때 확인할 것
- 환경 변수 4개(`UPSTAGE_API_KEY`, `UPSTAGE_AGENT_ID`, `UPSTAGE_CONFIG_ID`, `UPSTAGE_PROJECT_ID`)를 Vercel 프로젝트 설정에 넣는다. 키는 저장소에 넣지 않는다
- `/api/verify`는 업로드(최대 60초) + 실행 요청(최대 120초)을 한 함수에서 기다린다. 함수 최대 실행 시간이 이보다 짧으면 중간에 끊긴다. 배포 플랜의 기본값을 확인하고 필요하면 route에 `maxDuration`을 지정한다
- Vercel 함수 요청 본문 크기 제한이 있다. 샘플 PDF는 최대 788KB라 문제없을 것으로 보이나, 큰 PDF 업로드는 배포 후 확인한다
- 확인하지 않은 것: 실행 요청에 `include: ["all"]`을 주면 중간 단계(Parse · Classify · Extract) 결과가 오는지

