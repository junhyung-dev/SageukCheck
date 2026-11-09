# 작업 인수인계

다음 세션이 이어서 작업할 수 있도록 현재 상태를 정리한다. 작업을 이어가면 이 문서를 갱신한다.

- 마지막 갱신: 2026-11-10 (KST 새벽)
- **최종 제출 마감: 2026-11-10(화) 17시, 구글폼**

## 1. 지금까지 한 일

| 커밋 | 내용 |
|---|---|
| `8a09db4` | `AGENTS.md`, `CLAUDE.md`(→ `@AGENTS.md`), `docs/EVALUATION.md` 추가 |
| `37ae527` | `docs/SUBMISSION.md`(제출 가이드 · 피드백 요약), `docs/MISSION2_REVIEW.md` 추가 |
| `28d1892` | 서비스의 모든 Upstage 요청에 `x-project-id` 헤더 추가 (`UPSTAGE_PROJECT_ID`) |
| `5109afd` | 정답지 자동 대조 스크립트 `npm run verify:answers`, `docs/VERIFY.md`, `docs/UPSTAGE_API.md`, `data/mission2/` |

- GitHub 이슈 #1~#14 등록 (선후행 순서대로, 번호 = 진행 순서). 계획 전체는 이슈 본문 참고.
- 이슈 댓글: #1(출력 형식 비교 근거 2건), #5(사료 누락 감지 버그), #11(서비스 헤더 수정 · 실행 확인)

## 2. 마지막 커밋에 포함된 것과 로컬에만 있는 것

- 커밋됨: `docs/FINAL_REVIEW.md`, `docs/HANDOFF.md`(이 문서), `AGENTS.md` 문서 목록, `data/final/` PDF 15개
- 로컬에만 있음
  - `data/final/경크크_최종제출_set04.pdf:Zone.Identifier` — Windows 다운로드 표시 파일. `.gitignore`로 제외했고 삭제해도 된다.
  - `.env`의 `UPSTAGE_PROJECT_ID` (`.env`는 `.gitignore` 대상)

## 3. 현재 상태 요약

- 최종 산출물 4종은 팀 공유 폴더 `C:\Users\junhy\Downloads\업스테이지 해커톤 최종\`에 `SageukCheck_Final_*` 이름으로 있다. 내용은 [`FINAL_REVIEW.md`](FINAL_REVIEW.md).
- 워크플로우는 v6 (`agt_JfWkL5Ca5v5SUDYL2GwARR`, config 6). `.env`도 같은 값.
- `data/final/`의 PDF 15개는 정답지 `file` 이름과 일치하고 사전 점검 통과. 정답지 JSON은 아직 `data/final/`에 없다.
- v6 + 미션 2 데이터 5건 실행 결과: decision 5/5 일치, `source_reference` 0/5(형식 차이), E의 `missing_documents` 불일치. 상세는 이슈 #1 · #5 댓글.
- 사이트(Studio)에서 돌린 실행 결과는 API로 목록 조회가 안 된다(`GET /v2/responses` → 405). job ID를 알면 `GET /v2/responses/{job_id}`로 가져올 수 있다.

## 4. 다음에 할 일 (순서대로)

1. 최종 정답지를 `data/final/경크크_최종제출_answer.json`으로 넣고 `Zone.Identifier` 파일 삭제
2. 사전 점검
   ```bash
   npm run verify:answers -- --answer data/final/경크크_최종제출_answer.json --check-only --expect-prefix 경크크_최종제출_
   ```
3. **15건 실제 실행 (#7)** — 동시 5건 기준 약 15~20분
   ```bash
   npm run verify:answers -- --answer data/final/경크크_최종제출_answer.json --concurrency 5 --out verify-reports/final-config6
   ```
4. 결과로 [`FINAL_REVIEW.md`](FINAL_REVIEW.md) 6절 위험을 확인하고, 고칠 쪽(프롬프트 #5 / 정답지 #6)을 팀과 결정 (#1)
5. set03 6쪽 평가 관련 문구 삭제 (#3)
6. 제출 파일 이름을 `경크크_최종제출_*`로 맞추기, 설계서 머리글 확인 (#10, #14)
7. Studio에서 수정하면 config 번호가 바뀐다 → `.env`의 `UPSTAGE_CONFIG_ID`를 갱신하고 3번 재실행 → 라이브러리 게시(#8)는 최종 config로

## 5. 참고

- 작업 규칙: [`AGENTS.md`](../AGENTS.md) (커밋 형식 `<type>: <한국어 요약>`, `Co-authored-by` 금지, API 키 직접 기재 금지)
- 1건 실행 시간 약 2~5분, 토큰 건당 약 7,000~62,000
- 스크립트의 실행 요청 타임아웃은 120초(서비스 기본 30초). 30초에서는 동시 실행 중 끊기는 일이 있었다.
- `.env`가 CRLF 줄바꿈이다. 스크립트 · 서비스는 값을 trim해서 문제없지만, 셸에서 `source .env` 하면 `\r`이 섞인다.
