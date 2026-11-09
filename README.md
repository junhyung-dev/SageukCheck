# 史劇Check (사극체크) — AI 사극 역사 고증 검수 서비스

> **"사극의 한 장면, 역사의 기록으로 검증하다."**
> 사극 대본과 역사 사료(『조선왕조실록』 등)를 대조하여 역사적 사실의 일치 여부를 검증하는 AI 기반 역사 고증 1차 검수 웹 서비스입니다.

---

## 1. 서비스 개요

사극 제작 과정에서는 대본에 등장하는 역사적 인물, 사건, 날짜, 정책 등을 역사 기록과 대조하는 작업이 필수적입니다. **史劇Check (사극체크)** 는 사극 대본과 역사 사료가 수록된 PDF 문서를 업로드하면, **Upstage Studio**로 구축된 문서 분석 워크플로우(`Parse → Classify → Extract → Merge → Instruct`)를 API로 호출하여 **일치 / 충돌 / 검토 필요** 판정과 판정 근거, 역사 사료 출처, 누락 문서 여부를 자동으로 검수해 줍니다.

### 핵심 기능

- **실제 Upstage Studio Agents API 연동**:
  - `POST https://api.upstage.ai/v2/files` 로 PDF 문서 업로드 및 `file_id` 발급
  - `POST https://api.upstage.ai/v2/responses` 로 Studio Agent(`agt_BeWFUxUXkK7tzMpxscYduZ`, `config_id: "1"`) 실행
  - `GET https://api.upstage.ai/v2/responses/{job_id}?include[]=last` 폴링을 통한 실시간 작업 상태(`queued`, `in_progress`, `completed`, `failed`) 추적
  - 분석 완료 후 업로드된 임시 파일 자동 정리(`DELETE /v2/files/{file_id}`)로 불필요한 장기 저장 방지
- **강건한 AI 응답 파싱 (`result-parser.ts`)**:
  - `metadata.enum` 판정값 최우선 반영 및 `content` 다중 줄 키-값 문자열(`scene_id`, `decision`, `reason`, `source_reference`, `missing_documents`) 정밀 파싱
  - 여러 줄로 구성된 `reason`, 문자열/배열 혼합 형태의 `missing_documents`, 비정형 응답에 대한 방어적 정규화
  - AI가 제공하지 않은 역사적 사실이나 출처를 임의로 지어내지 않는(Non-hallucinating) 검토 권고문 생성
- **Modern Korean Historical Archive 디자인**:
  - 한지(`#F7F4ED`), 먹색(`#252923`), 송엽색(`#29493D`), 인주 적갈색(`#A7473D`) 컬러 팔레트와 명조(`Noto Serif KR`)·본고딕(`Noto Sans KR`) 타이포그래피 조화
  - 좌우 2단 대조 레이아웃: 왼쪽 원본 PDF 뷰어(페이지 이동, 확대/축소, 전체 페이지 보기) + 오른쪽 고증 검수 보고서(결과 복사, 인쇄/PDF 저장, 원본 JSON 디버그 뷰어)
- **해커톤 테스트 데이터셋 5종 (`set01` ~ `set05`) 내장**:
  - 웹 UI에서 클릭 한 번으로 `SC-001` ~ `SC-005` 실제 PDF 문서를 불러와 Upstage API 워크플로우를 즉시 실행·검증 가능

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
      PdfUploadPanel.tsx     # 드래그 앤 드롭 PDF 업로드 및 set01~set05 원클릭 로더
    analysis/
      AnalysisProgressPanel.tsx # 실제 API 상태(uploading/queued/in_progress/completed) 표시 화면
    results/
      VerificationResultCard.tsx # 고증 판정(일치/충돌/검토 필요) 카드, 복사/인쇄, 디버그 아코디언
    pdf/
      PdfDocumentViewer.tsx  # PDF 원본 미리보기, 페이지 이동, 확대/축소, 전체 페이지 열람
  lib/
    upstage.ts               # Upstage Files & Responses API 서버 통신 모듈
    result-parser.ts         # Instruct 노드 출력 정규화 및 방어적 파서
    sample-datasets.ts       # 테스트 케이스 set01~set05 메타데이터
  types/
    verification.ts          # VerificationResult 등 핵심 타입 정의
public/
  samples/                   # 해커톤 검증용 실제 PDF 데이터셋 5종 (SC-001 ~ SC-005)
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
UPSTAGE_AGENT_ID=agt_BeWFUxUXkK7tzMpxscYduZ
UPSTAGE_CONFIG_ID=1
```

### 3) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 에 접속합니다.

---

## 5. 테스트 케이스 (`set01` ~ `set05`) 검증 안내

`/verify` 화면 하단(또는 메인 페이지 하단)에서 5종의 공식 테스트 데이터셋을 바로 불러와 검증할 수 있습니다.

| 세트 | 장면 번호 | 구성 내용 | 핵심 검증 포인트 |
| :--- | :--- | :--- | :--- |
| **Set 01** | `SC-001` | 제1화 대본 (세종 25년 겨울, 언문 28자 친제) + 『세종실록』 102권 사료 | 대본과 실록 사료의 사실관계 **일치** 검증 |
| **Set 02** | `SC-002` | 제2화 대본 (최만리의 언문 찬성 상소) + 『세종실록』 103권 반대 상소 사료 | 실제 역사와 정반대인 서술에 대한 **충돌** 검증 |
| **Set 03** | `SC-003` | 제3화 대본 (세종 28년 9월 훈민정음 완성) + 『세종실록』 113권 사료 + 검토 요청서 | 창제(1443)와 완성(1446) 시점 구분 및 실록 기사 **일치** 검증 |
| **Set 04** | `SC-004` | 제4화 대본 (《운회》 번역) + 『세종실록』 103권 (세종 26년 2월 16일) 사료 | 대본 속 《운회》 번역 왕명과 『세종실록』 103권 기사의 **일치** 검증 |
| **Set 05** | `SC-005` | 제5화 대본 (《운회》 번역 기록 대조) 단일 수록 (역사 사료 누락) | 역사 사료 누락(`missing_documents`) 감지 및 **검토 필요** 판정 검증 |
