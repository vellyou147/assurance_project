import type { DisclosureSearchResult } from "@/types/disclosure";

export interface ComparisonSummaryView { commonItems: string[]; headers: string[]; rows: string[][]; checklistItems: string[]; }

export function buildComparisonSummary(results: DisclosureSearchResult[]): ComparisonSummaryView {
  const successful = results.filter((result) => result.status === "success" && result.analysis);
  const headers = ["공시 항목", ...results.slice(0, 3).map((result) => result.company.corpName)];
  if (successful.length === 0) return { headers, commonItems: [], rows: [], checklistItems: [] };
  const firstAnalysis = successful[0].analysis;
  if (!firstAnalysis) return { headers, commonItems: [], rows: [], checklistItems: [] };

  const commonItems = firstAnalysis.items.filter((item) => successful.every((result) => result.analysis?.items.some((candidate) => candidate.id === item.id && candidate.detected))).map((item) => `${successful.length}개 기업에서 ‘${item.label}’ 공시 항목 확인`);
  const rows = firstAnalysis.items.map((item) => [item.label, ...results.slice(0, 3).map((result) => analysisCell(result, item.id))]);
  const checklistItems = successful.flatMap((result) => result.analysis?.items.filter((item) => item.detected).map((item) => `${result.company.corpName}: ${item.label} 검토`) ?? []);
  return { headers, commonItems, rows, checklistItems: [...new Set(checklistItems)].slice(0, 16) };
}

function analysisCell(result: DisclosureSearchResult, id: string) {
  if (result.status !== "success") return result.status === "no_note" ? "관련 주석 없음" : result.status === "no_filing" ? "공시 없음" : "조회 오류";
  const item = result.analysis?.items.find((candidate) => candidate.id === id);
  if (!item?.detected) return "미확인";
  return item.evidence ? `확인 · ${item.evidence}` : "확인";
}
