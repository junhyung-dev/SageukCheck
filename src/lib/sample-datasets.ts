import { SampleDataset } from "@/types/verification";

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "set01",
    code: "SC-001",
    title: "백성의 글자 · 제1화",
    episode: "세종 25년 겨울, 훈민정음 28자 친제",
    era: "세종 25년(1443년) 12월",
    summary:
      "세종이 백성을 위해 스물여덟 자의 언문을 직접 창제하였다는 대본과 『세종실록』 102권 사료가 함께 수록된 문서",
    expectedPoint: "대본과 실록 사료의 역사적 사실 일치 여부 검수",
    filename: "/samples/set01_sc001.pdf",
    pages: 3,
  },
  {
    id: "set02",
    code: "SC-002",
    title: "백성의 글자 · 제2화",
    episode: "최만리 등의 언문 제작 관련 상소",
    era: "세종 26년(1444년) 2월 20일",
    summary:
      "최만리가 언문 제작을 '적극 찬성'하는 상소를 올렸다고 서술한 대본과 『세종실록』 103권 언문 제작 반대 상소 사료",
    expectedPoint: "대본 속 인물 행적과 실제 사료의 정반대 서술(충돌) 검증",
    filename: "/samples/set02_sc002.pdf",
    pages: 7,
  },
  {
    id: "set03",
    code: "SC-003",
    title: "백성의 글자 · 제3화",
    episode: "집현전 기록 보관실, 《훈민정음》 해례본 완성",
    era: "세종 28년(1446년) 9월",
    summary:
      "《훈민정음》 어제 서문과 정인지 서문이 완성된 시점 및 구성을 다룬 대본, 『세종실록』 113권 사료, 검토 요청서 포함",
    expectedPoint: "창제(1443)와 반포·완성(1446) 시점 구분 및 실록 기사 부합 여부",
    filename: "/samples/set03_sc003.pdf",
    pages: 6,
  },
  {
    id: "set04",
    code: "SC-004",
    title: "백성의 글자 · 제4화",
    episode: "의사청 옆 서고, 최항·박팽년의 《운회》 번역",
    era: "세종 26년(1444년) 2월",
    summary:
      "최항·박팽년 등에게 언문으로 《운회》를 번역하게 했다는 대본과 『세종실록』 103권(세종 26년 2월 16일) 사료가 수록된 문서",
    expectedPoint: "대본 속 《운회》 번역 왕명과 『세종실록』 103권 기사의 사실 일치 검증",
    filename: "/samples/set04_sc004.pdf",
    pages: 3,
  },
  {
    id: "set05",
    code: "SC-005",
    title: "백성의 글자 · 제5화",
    episode: "집현전 서고, 《운회》 번역 기록 대조",
    era: "세종 26년(1444년) 2월",
    summary:
      "사극 촬영 대본만 포함되어 있고 대조할 역사 사료(실록 기사)가 누락된 상태로 제출된 문서",
    expectedPoint: "역사 사료 문서 누락 감지 및 '검토 필요' 판정 검증",
    filename: "/samples/set05_sc005.pdf",
    pages: 2,
  },
];
