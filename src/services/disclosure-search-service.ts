import "server-only";
import { analyzeDisclosureTopic } from "@/lib/disclosure-analysis";
import { DartApiError } from "@/services/dart-client";
import { downloadDisclosureArchive, extractArchiveEntries, listArchiveEntries } from "@/services/disclosure-download-service";
import { identifyMainDocuments, parseDisclosureDocument } from "@/services/disclosure-parser";
import { findTargetFiling } from "@/services/filing-service";
import { findRelevantSections } from "@/services/note-search-service";
import type { DisclosureSearchRequest, DisclosureSearchResult } from "@/types/disclosure";

const resultCache = new Map<string, DisclosureSearchResult>();

export async function searchDisclosures(input: DisclosureSearchRequest): Promise<DisclosureSearchResult[]> {
  const results: DisclosureSearchResult[] = [];
  for (const company of input.companies) {
    const cacheKey = `section-boundary-v4:${company.corpCode}:${input.fiscalYear}:${input.reportType}:${input.noteTopic}`;
    const cached = resultCache.get(cacheKey);
    if (cached) { results.push(cached); continue; }
    const result = await searchCompanyDisclosure(company, input);
    resultCache.set(cacheKey, result);
    results.push(result);
  }
  return results;
}

async function searchCompanyDisclosure(company: DisclosureSearchRequest["companies"][number], input: DisclosureSearchRequest): Promise<DisclosureSearchResult> {
  try {
    const filing = await findTargetFiling(company.corpCode, input.fiscalYear, input.reportType);
    if (!filing) return { company, status: "no_filing", sections: [], errorMessage: "선택한 조건에 해당하는 공시보고서를 찾지 못했습니다." };
    const archive = await downloadDisclosureArchive(filing.rceptNo);
    const archiveEntries = listArchiveEntries(archive);
    const documents = identifyMainDocuments(extractArchiveEntries(archive)).map((entry) => parseDisclosureDocument(entry.fileName, entry.content));
    const sections = findRelevantSections(documents, input.noteTopic);
    return { company, filing, status: sections.length ? "success" : "no_note", sections, analysis: analyzeDisclosureTopic(input.noteTopic, sections), archiveEntries, processingStage: "완료", errorMessage: sections.length ? undefined : "관련 주석을 찾지 못했습니다." };
  } catch (error) {
    console.error("[disclosure-search]", company.corpCode, error instanceof Error ? error.message : "unknown error");
    return { company, status: "error", sections: [], errorMessage: error instanceof DartApiError ? error.message : "OpenDART 공시자료를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

// TODO(Vercel): 메모리 결과 캐시는 인스턴스 간 공유되지 않으므로 운영 환경에서는 Redis/KV 등으로 교체한다.
