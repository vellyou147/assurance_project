export type ReportType = "사업보고서" | "반기보고서" | "분기보고서";
export type ViewMode = "vertical" | "side-by-side";

import type { Company } from "@/types/company";
export type { Company } from "@/types/company";
export interface SearchFilters { baseCompany?: Company; comparisonCompanies: Company[]; year: string; reportType: ReportType; topic: string; }
export interface Filing { id: string; company: Company; reportName: string; year: string; disclosedAt: string; scope: "연결" | "별도"; dartUrl: string; }
export interface DisclosureNote { id: string; filing: Filing; title: string; paragraphs: string[]; table: { headers: string[]; rows: string[][] }; }
export interface SearchResult { filing: Filing; notes: DisclosureNote[]; }
export interface ComparisonSummary { commonItems: string[]; differences: string[]; }
export interface ResearchMemo { id: string; content: string; companyId?: string; noteId?: string; pinned: boolean; createdAt: string; }
