import "server-only";
import { fetchDartJson } from "@/services/dart-client";
import type { FilingCandidate, SelectedFiling } from "@/types/disclosure";

const reportRules = {
  "사업보고서": { detail: "A001", months: [1, 2, 3, 4, 5, 6] },
  "반기보고서": { detail: "A002", months: [7, 8, 9, 10] },
  "분기보고서": { detail: "A003", months: [4, 5, 6, 10, 11, 12] },
} as const;
type ReportType = keyof typeof reportRules;
interface DartListResponse { list?: Array<{ rcept_no: string; report_nm: string; rcept_dt: string; corp_name: string }>; }

export async function findTargetFiling(corpCode: string, fiscalYear: string, reportType: ReportType): Promise<SelectedFiling | null> {
  const candidates = await searchFilingCandidates(corpCode, fiscalYear, reportType);
  return selectLatestValidFiling(candidates, reportType);
}

export function selectLatestValidFiling(candidates: FilingCandidate[], reportType: ReportType): SelectedFiling | null {
  const valid = candidates.filter((candidate) => matchesReportType(candidate.reportName, reportType));
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => b.filingDate.localeCompare(a.filingDate) || Number(b.isCorrection) - Number(a.isCorrection) || b.rceptNo.localeCompare(a.rceptNo));
  const selected = sorted[0];
  return { ...selected, dartUrl: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${selected.rceptNo}`, selectionReason: selected.isCorrection ? "동일 조건의 정정공시 중 가장 최근 접수본을 선택했습니다." : "동일 조건의 가장 최근 접수본을 선택했습니다." };
}

async function searchFilingCandidates(corpCode: string, fiscalYear: string, reportType: ReportType): Promise<FilingCandidate[]> {
  const year = Number(fiscalYear); const rule = reportRules[reportType]; const months = reportType === "사업보고서" ? rule.months.map((month) => ({ year: year + 1, month })) : rule.months.map((month) => ({ year, month }));
  const responses = await Promise.all(months.map(async ({ year: filingYear, month }) => fetchDartJson<DartListResponse>("list.json", { corp_code: corpCode, bgn_de: date(filingYear, month, 1), end_de: date(filingYear, month, daysInMonth(filingYear, month)), pblntf_ty: "A", pblntf_detail_ty: rule.detail, page_no: "1", page_count: "100" }).catch((error) => { if (error instanceof Error && error.message.includes("찾지 못했습니다")) return { list: [] }; throw error; })));
  return responses.flatMap((response) => response.list ?? []).map((item) => ({ rceptNo: item.rcept_no, reportName: item.report_nm, filingDate: item.rcept_dt, corpName: item.corp_name, isCorrection: /정정/.test(item.report_nm) }));
}

function matchesReportType(reportName: string, reportType: ReportType) { const normalized = reportName.replace(/\s/g, ""); return normalized.includes(reportType); }
function date(year: number, month: number, day: number) { return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`; }
function daysInMonth(year: number, month: number) { return new Date(year, month, 0).getDate(); }
