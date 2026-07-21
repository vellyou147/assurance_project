import { createMockResults } from "@/lib/mock-data";
import type { DisclosureNote, Filing, SearchFilters, SearchResult } from "@/lib/types";

export function searchFilings(filters: SearchFilters): SearchResult[] { const selected = [filters.baseCompany, ...filters.comparisonCompanies].filter((company): company is NonNullable<typeof company> => Boolean(company)); return createMockResults(selected.map((company) => company.id), filters); }
export async function fetchDisclosureDocument(filingId: string): Promise<DisclosureNote | null> { const { companies } = await import("@/lib/mock-data"); return searchFilings({ baseCompany: companies[0], comparisonCompanies: [], year: "2025", reportType: "사업보고서", topic: "무형자산 및 개발비" }).flatMap((item) => item.notes).find((note) => note.filing.id === filingId) ?? null; }
export async function extractRelatedNotes(filing: Filing, topic: string): Promise<DisclosureNote[]> { void filing; void topic; return []; }
