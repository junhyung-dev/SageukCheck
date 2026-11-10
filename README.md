# 史劇Check (사극체크) — AI 사극 역사 고증 검수 서비스

> **"사극의 한 장면, 역사의 기록으로 검증하다."**
> 사극 대본과 역사 사료(『조선왕조실록』 등)를 대조하여 역사적 사실의 일치 여부를 검증하는 AI 기반 역사 고증 1차 검수 웹 서비스입니다.

---

## 1. 서비스 개요

사극 제작 과정에서는 대본에 등장하는 역사적 인물, 사건, 날짜, 정책 등을 역사 기록과 대조하는 작업이 필수적입니다. **史劇Check (사극체크)** 는 사극 대본과 역사 사료가 수록된 PDF 문서를 업로드하면, **Upstage Studio**로 구축된 문서 분석 워크플로우(`Parse → Classify → Extract → Merge → Instruct`)를 API로 호출하여 **일치 / 충돌 / 검토 필요** 판정과 판정 근거, 역사 사료 출처, 누락 문서 여부를 자동으로 검수해 줍니다.

### 핵심 기능

- **실제 Upstage Studio Agents API 연동**:
  - `POST https://api.upstage.ai/v2/files` 로 PDF 문서 업로드 및 `file_id` 발급
  - `POST https://api.upstage.ai/v2/responses` 로 최종 워크플로우 `최종_사극체크`(`agt_bRU6jFjmhXuXGi8KLZucvp`, `config_id: "4"`) 실행. 모든 요청에 `x-project-id` 헤더 포함
  - `GET https://api.upstage.ai/v2/responses/{job_id}?include[]=last` 폴링을 통한 실시간 작업 상태(`queued`, `in_progress`, `completed`, `failed`) 추적
  - 분석 완료 후 업로드된 임시 파일 자동 정리(`DELETE /v2/files/{file_id}`)로 불필요한 장기 저장 방지
- **강건한 AI 응답 파싱 (`result-parser.ts`)**:
  - `metadata.enum` 판정값 최우선 반영 및 `content` 다중 줄 키-값 문자열(`scene_id`, `decision`, `reason`, `source_reference`, `missing_documents`) 정밀 파싱
  - 여러 줄로 구성된 `reason`, 문자열/배열 혼합 형태의 `missing_documents`, 비정형 응답에 대한 방어적 정규화
  - `additional_values.citations`(인용 표시 `【†n】`별 근거 페이지 · 좌표)와 `additional_values.merge`(Classify가 나눈 문서별 페이지 범위)를 그대로 전달. 응답 본문은 `【†n】` 표시를 남긴 형태(`annotatedFields`)로도 전달해 근거 위치와 연결할 수 있음
- **Modern Korean Historical Archive 디자인**:
  - 한지(`#F7F4ED`), 먹색(`#252923`), 송엽색(`#29493D`), 인주 적갈색(`#A7473D`) 컬러 팔레트와 명조(`Noto Serif KR`)·본고딕(`Noto Sans KR`) 타이포그래피 조화
  - 좌우 2단 대조 레이아웃: 왼쪽 원본 PDF 뷰어(페이지 이동, 확대/축소, 전체 페이지 보기) + 오른쪽 판정 결과(판정 근거, 사료 출처, 빠진 문서, 결과 복사, 인쇄). 원본 응답 디버그는 `/verify?debug=1`일 때만 보인다
- **최종 데이터셋 18케이스 (`set01` ~ `set18`) 내장**:
  - `data/final/`의 PDF와 같은 파일을 `public/samples/`에 두고, 웹 UI에서 `SC-001` ~ `SC-018`을 불러와 워크플로우를 실행할 수 있음

---

## 2. 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **PDF Viewer**: `pdfjs-dist` 기반 캔버스 뷰어 (페이지 이동·확대/축소·전체 페이지 열람 및 브라우저 네이티브 PDF 뷰어 전환 지원)
- **Backend**: Next.js Route Handlers (`/api/verify`, `/api/jobs/[id]`)
- **AI API**: Upstage Studio Agents API (`/v2/files`, `/v2/responses`)

---

## 3. 프로젝트 폴더 구조

```text
src/
  app/
    page.tsx                 # 메인 페이지 (Hero, 3단계 원리, 고증 원칙 소개, 테스트셋 바로가기)
    verify/
      page.tsx               # 고증 검수 워크스페이스 (PDF 업로드 → 실시간 진행 상태 → 2단 결과 뷰어)
    api/
      verify/
        route.ts             # PDF 검증 후 Upstage Files API 업로드 및 Responses Job 생성
      jobs/
        [id]/
          route.ts           # Upstage Responses Job 상태 조회 및 완료 결과 파싱·반환
  components/
    layout/
      Header.tsx             # 상단 내비게이션 바 (史劇Check 로고 및 메뉴)
      Footer.tsx             # 하단 푸터 및 1차 검수 도구 안내문
    upload/
      PdfUploadPanel.tsx     # 드래그 앤 드롭 PDF 업로드 및 샘플 원클릭 로더
    analysis/
      AnalysisProgressPanel.tsx # 분석 진행 화면 (단계 3칸, 경과 시간, 실패 시 다시 시도)
    results/
      VerificationResultCard.tsx # 판정(일치/충돌/검토 필요) 카드, 복사/인쇄, ?debug=1 디버그
    pdf/
      PdfDocumentViewer.tsx  # PDF 원본 미리보기, 페이지 이동, 확대/축소, 전체 페이지 열람
  lib/
    upstage.ts               # Upstage Files & Responses API 서버 통신 모듈
    result-parser.ts         # Instruct 노드 출력 정규화 및 방어적 파서
    sample-datasets.ts       # 최종 데이터셋 set01~set18 메타데이터 (정답지 case_id · 판정 포함)
  types/
    verification.ts          # VerificationResult 등 핵심 타입 정의
public/
  samples/                   # 최종 데이터셋 PDF 18개 (set01.pdf ~ set18.pdf = data/final/경크크_최종제출_setNN.pdf)
```

---

## 4. 시작하기 (설치 및 실행 방법)

### 1) 패키지 설치

```bash
npm install
```

### 2) 환경 변수 설정 (`.env.local`)

프로젝트 루트의 `.env.example` 파일을 참고하여 `.env.local` 파일을 생성하고 발급받은 `UPSTAGE_API_KEY`를 입력합니다.
*(보안을 위해 API Key는 서버 Route Handler에서만 읽으며 클라이언트로 절대 노출되지 않습니다.)*

```env
UPSTAGE_API_KEY=up_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
UPSTAGE_AGENT_ID=agt_bRU6jFjmhXuXGi8KLZucvp
UPSTAGE_CONFIG_ID=4
UPSTAGE_PROJECT_ID=proj_ReKt96vC6hC894rMxHpYih
```

### 3) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 에 접속합니다.

---

## 5. 테스트 케이스 (`set01` ~ `set18`)

`/verify` 화면에서 최종 데이터셋 18케이스를 바로 불러와 실행할 수 있습니다.
기대 판정은 정답지(`data/final/경크크_최종제출_answer.json`) 값이고, 케이스별 설명은 `src/lib/sample-datasets.ts`에 있습니다.

| 세트 | case | 장면 | 작품 · 회차 | 문서 | 기대 판정 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| set01 | A | SC-001 | 백성의 글자 제1화 | 대본, 사료 | 일치 |
| set02 | B | SC-002 | 백성의 글자 제2화 | 대본, 사료 | 충돌 |
| set03 | C | SC-003 | 백성의 글자 제3화 | 대본, 사료, 검토 요청서 | 일치 |
| set04 | D | SC-004 | 백성의 글자 제4화 | 대본, 사료 | 일치 |
| set05 | E | SC-005 | 백성의 글자 제5화 | 대본 (사료 누락) | 검토 필요 |
| set06 | F | SC-006 | 비를 재는 그릇 제1화 | 대본, 사료 | 일치 |
| set07 | G | SC-007 | 숫자 하나의 차이 제1화 | 대본, 사료 | 충돌 |
| set08 | H | SC-008 | 집현전의 검토표 제2화 | 대본, 사료 | 일치 |
| set09 | I | SC-009 | 새로운 시험의 문턱 제2화 | 대본, 사료 | 충돌 |
| set10 | J | SC-010 | 두 장의 공문 제3화 | 대본, 사료 2건 | 일치 |
| set11 | K | SC-011 | 시험 공고의 수정 제3화 | 대본, 사료, 검토 요청서 | 충돌 |
| set12 | L | SC-012 | 오래된 치수 기록 제4화 | 대본, 저품질 사료 | 검토 필요 |
| set13 | M | SC-013 | 흐릿해진 지방 규정 제4화 | 대본, 저품질 사료 | 검토 필요 |
| set14 | N | SC-014 | 사관의 붓 제5화 | 대본 (사료 누락) | 검토 필요 |
| set15 | O | SC-015 | 가을에 묶인 책 제5화 | 대본, 무관한 사료 | 검토 필요 |
| set16 | P | SC-016 | 별이 지는 담장 제2화 (퓨전) | 대본, 사료 2건 | 일치 |
| set17 | Q | SC-017 | 암자의 스물여덟 글자 제5화 (퓨전) | 대본, 사료 | 충돌 |
| set18 | R | SC-018 | 먹빛 결사 제7화 (퓨전) | 대본, 사료, 검토 요청서 | 검토 필요 |
