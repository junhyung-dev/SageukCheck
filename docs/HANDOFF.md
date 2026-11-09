# 작업 인수인계

다음 세션이 이어서 작업할 수 있도록 현재 상태를 정리한다. 작업을 이어가면 이 문서를 갱신한다.

- 마지막 갱신: 2026-11-10 03:40 KST
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

1. Studio 화면에서 config 4로 set01~18을 한 번씩 실행 (라이브러리 샘플 선택에 완료된 실행이 필요)
2. (완료) config 4 워크플로우 JSON → `submission/경크크_최종제출_workflow.json` (에이전트 `agt_bRU6…`, `configVer: 4` 확인) (#9)
3. 라이브러리 게시: config 4, 샘플 set01~18 전부 체크(예전 파일 제외), 승인 요청, 링크 복사 (#8)
4. (완료) 유형표 39줄, 설계서 세 곳 수정 → `submission/` (#6, #10). 남은 확인: 설계서 머리글(템플릿 문구), 한계 문구(J, 기사 ID 없는 자료)를 넣을지
5. 산출물 파일 이름을 `경크크_최종제출_*`로 맞추고 데모 영상 · 발표 자료 준비, 구글폼 제출 (#12~#14)
6. 프롬프트를 다시 고치면 config 번호가 바뀐다 → `.env` 갱신 → 전체 재실행 → 게시 · 내보내기는 그 config로
7. 제출 후: [`FINAL_REVIEW.md`](FINAL_REVIEW.md) 9절 후속 설계 과제

## 5. 참고

- 작업 규칙: [`AGENTS.md`](../AGENTS.md) (커밋 형식 `<type>: <한국어 요약>`, `Co-authored-by` 금지, API 키 직접 기재 금지)
- 1건 실행 시간 약 20초~5분(동시 실행 시 앞쪽이 대기열 때문에 길어짐), 토큰 건당 약 7,000~62,000
- 스크립트의 실행 요청 타임아웃은 120초(서비스 기본 30초). 30초에서는 동시 실행 중 끊기는 일이 있었다.
- `.env`가 CRLF 줄바꿈이다. 스크립트 · 서비스는 값을 trim해서 문제없지만, 셸에서 `source .env` 하면 `\r`이 섞인다.
