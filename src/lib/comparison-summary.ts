import type { DisclosureSearchResult } from "@/types/disclosure";

export interface ComparisonSummaryView {
  commonItems: string[];
  headers: string[];
  rows: string[][];
  checklistItems: string[];
}

export function buildComparisonSummary(results: DisclosureSearchResult[]): ComparisonSummaryView {
  const successful = results.filter((result) => result.status === "success" && result.sections.length > 0);
  const headers = ["항목", ...results.slice(0, 3).map((result) => result.company.corpName)];
  if (successful.length === 0) return { headers, commonItems: [], rows: [], checklistItems: [] };

  const keywordsByCompany = successful.map((result) => new Set(result.sections.flatMap((section) => section.matchedKeywords)));
  const commonKeywords = keywordsByCompany.length > 1
    ? [...keywordsByCompany[0]].filter((keyword) => keywordsByCompany.every((set) => set.has(keyword)))
    : [];
  const commonItems = commonKeywords.slice(0, 5).map((keyword) => `${successful.length}개 기업의 추출 주석에서 ‘${keyword}’ 확인`);
  const rows = ["추출 주석", "표 포함", "주석 제목", "확인 키워드"].map((label) => [
    label,
    ...results.slice(0, 3).map((result) => cellValue(label, result)),
  ]);
  const checklistItems = buildChecklistItems(successful, commonKeywords);
  return { headers, commonItems, rows, checklistItems };
}

function buildChecklistItems(results: DisclosureSearchResult[], commonKeywords: string[]) {
  const byCompany = results.flatMap((result) => {
    const title = result.sections[0]?.title;
    if (!title) return [];
    const items = [`${result.company.corpName}: ‘${title}’ 주석 제목 확인`];
    if (result.sections.some((section) => section.table)) items.push(`${result.company.corpName}: 추출 주석의 표 확인`);
    return items;
  });
  const shared = commonKeywords.map((keyword) => `${results.length}개 기업 공통 키워드 ‘${keyword}’ 검토`);
  return [...new Set([...byCompany, ...shared])].slice(0, 12);
}

function cellValue(label: string, result: DisclosureSearchResult) {
  if (result.status !== "success") {
    if (result.status === "no_filing") return "공시 없음";
    if (result.status === "no_note") return "관련 주석 없음";
    return "조회 오류";
  }
  if (label === "추출 주석") return `${result.sections.length}건`;
  if (label === "표 포함") return result.sections.some((section) => section.table) ? "포함" : "미확인";
  if (label === "주석 제목") return result.sections[0]?.title ?? "-";
  return [...new Set(result.sections.flatMap((section) => section.matchedKeywords))].slice(0, 3).join(", ") || "-";
}
