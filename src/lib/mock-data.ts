import type { Company, DisclosureNote, SearchFilters, SearchResult } from "@/lib/types";

export const companies: Company[] = [
  { id: "krafton", name: "크래프톤", code: "259960", corpCode: "00760971", corpName: "크래프톤", stockCode: "259960", isListed: true }, { id: "ncsoft", name: "엔씨소프트", code: "036570", corpCode: "00261443", corpName: "NC", stockCode: "036570", isListed: true },
  { id: "netmarble", name: "넷마블", code: "251270", corpCode: "00904672", corpName: "넷마블", stockCode: "251270", isListed: true }, { id: "kakao-games", name: "카카오게임즈", code: "293490", corpCode: "01137383", corpName: "카카오게임즈", stockCode: "293490", isListed: true },
  { id: "com2us", name: "컴투스", code: "078340", corpCode: "00266961", corpName: "컴투스", stockCode: "078340", isListed: true }, { id: "pearlabyss", name: "펄어비스", code: "263750", corpCode: "01086859", corpName: "펄어비스", stockCode: "263750", isListed: true },
];

export const topics = ["고객과의 계약에서 생기는 수익", "무형자산 및 개발비", "연구개발비", "유형자산", "리스", "금융상품", "영업부문", "충당부채", "특수관계자 거래", "주식기준보상"];
export const defaultFilters: SearchFilters = { comparisonCompanies: [], year: "2025", reportType: "사업보고서", topic: "무형자산 및 개발비" };

const descriptions: Record<string, string> = {
  krafton: "개발비는 기술적 실현가능성 및 미래 경제적 효익의 유입 가능성이 확인된 시점부터 무형자산으로 인식하고 있습니다.",
  ncsoft: "연구단계에서 발생한 지출은 발생기간의 비용으로 처리하며, 개발단계 지출은 인식요건 충족 여부를 검토합니다.",
  netmarble: "게임 콘텐츠의 개발 관련 원가는 내부 관리기준에 따라 프로젝트별로 집계하고, 자산화 요건 충족분을 개발비로 계상합니다.",
  "kakao-games": "개발비는 사용 가능한 시점부터 예상 사용기간에 걸쳐 정액법으로 상각하며, 매 보고기간 손상징후를 검토합니다.",
  com2us: "개발 프로젝트별 상용화 가능성과 회수가능가액을 정기적으로 검토하여 무형자산의 장부금액을 평가합니다.",
  pearlabyss: "새로운 게임 서비스 관련 개발활동은 단계별 검토 절차에 따라 비용 또는 무형자산으로 구분하여 반영합니다.",
};

export function createMockResults(companyIds: string[], filters: SearchFilters): SearchResult[] {
  return companyIds.map((companyId, index) => {
    const company = companies.find((item) => item.id === companyId) ?? companies[0];
    const filing = { id: `${company.id}-${filters.year}`, company, reportName: `${filters.year}년 ${filters.reportType}`, year: filters.year, disclosedAt: `${filters.year}-03-${String(17 + index).padStart(2, "0")}`, scope: index === 1 ? "별도" as const : "연결" as const, dartUrl: "https://dart.fss.or.kr" };
    const notes: DisclosureNote[] = [{
      id: `${company.id}-intangible`, filing, title: "무형자산 및 개발비",
      paragraphs: [descriptions[company.id], "자산으로 인식한 개발비는 해당 자산이 사용 가능한 시점부터 추정 내용연수에 걸쳐 상각합니다. 회수가능액이 장부금액에 미달할 가능성이 있는 경우에는 손상검사를 수행합니다."],
      table: { headers: ["구분", `${Number(filters.year) - 1}년`, `${filters.year}년`], rows: [["기초 장부금액", "12,400", "14,800"], ["당기 증가", "5,600", "6,200"], ["상각 및 손상", "(3,200)", "(3,900)"]] },
    }];
    if (index === 0) notes.push({ ...notes[0], id: `${company.id}-policy`, title: "중요한 회계정책 - 무형자산", paragraphs: ["무형자산은 취득원가에서 상각누계액 및 손상차손누계액을 차감하여 측정합니다."], table: { headers: ["정책 구분", "적용 내용"], rows: [["상각방법", "정액법"], ["손상검사", "징후 발생 시 수행"]] } });
    return { filing, notes };
  });
}
