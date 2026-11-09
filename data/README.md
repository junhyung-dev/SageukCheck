# data

정답지와 데이터셋 파일을 두는 폴더. 정답지 자동 대조 스크립트(`npm run verify:answers`)의 입력이다.
사용법은 [`docs/VERIFY.md`](../docs/VERIFY.md)를 본다.

## 구조

| 폴더 | 내용 |
|---|---|
| `mission2/` | 미션 2 제출본. 정답지와 데이터셋 5건(set01~05, 문서 10건) |
| `final/` | 최종 제출본. 정답지 `경크크_최종제출_answer.json`과 PDF 18개(set01~18, 문서 39건). 현황은 `docs/FINAL_REVIEW.md` |

## 규칙

- 정답지와 그 정답지가 가리키는 파일을 **같은 폴더**에 둔다.
- 정답지 `file` 값과 파일 이름을 확장자까지 똑같이 맞춘다.
- 데이터셋은 라이브러리에 공개되므로 가상 · 공개 문서만 둔다. 실제 개인정보를 넣지 않는다.

## mission2 참고

- `경크크_미션2_set04.pdf`는 사료가 흐린 이미지인 **저품질 버전**이다(md5 `46d47db8592eb0c926dc4e71a8fef0f4`). 정답지 case D(`검토 필요`)는 이 파일 기준이다.
- `public/samples/set04_sc004.pdf`는 사료가 깨끗한 다른 버전이라 이 정답지와 맞지 않는다. 자세한 내용은 [`docs/MISSION2_REVIEW.md`](../docs/MISSION2_REVIEW.md) 4절.
