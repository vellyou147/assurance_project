import type { Company } from "@/types/company";

export type DisclosureStatus = "success" | "no_filing" | "no_note" | "error";
export interface FilingCandidate { rceptNo: string; reportName: string; filingDate: string; corpName: string; isCorrection: boolean; }
export interface SelectedFiling extends FilingCandidate { selectionReason: string; dartUrl: string; }
export interface DisclosureArchiveEntry { fileName: string; compressedSize: number; uncompressedSize: number; compressionMethod: number; isDocumentCandidate: boolean; }
export interface DisclosureTable { headers: string[]; rows: string[][]; }
export interface DisclosureSection { id: string; title: string; plainText: string; htmlContent?: string; matchedKeywords: string[]; sourceFile?: string; table?: DisclosureTable; }
export interface DisclosureAnalysisItem { id: string; label: string; detected: boolean; evidence?: string; }
export interface DisclosureTopicAnalysis { topic: string; items: DisclosureAnalysisItem[]; }
export interface DisclosureSearchResult { company: Pick<Company, "corpCode" | "corpName" | "stockCode">; filing?: SelectedFiling; status: DisclosureStatus; sections: DisclosureSection[]; analysis?: DisclosureTopicAnalysis; archiveEntries?: DisclosureArchiveEntry[]; errorMessage?: string; processingStage?: DisclosureProcessingStage; }
export type DisclosureProcessingStage = "공시보고서 검색 중" | "공시 원문 다운로드 중" | "문서 목록 확인 중" | "주석 문서 분석 중" | "관련 주석 검색 중" | "완료";
export interface DisclosureSearchRequest { companies: Pick<Company, "corpCode" | "corpName" | "stockCode">[]; fiscalYear: string; reportType: "사업보고서" | "반기보고서" | "분기보고서"; noteTopic: string; }
