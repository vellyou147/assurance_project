"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DisclosureResult } from "@/components/DisclosureResult";
import { SearchFilters } from "@/components/SearchFilters";
import { SearchResultToolbar } from "@/components/SearchResultToolbar";
import { ServiceIntroduction } from "@/components/ServiceIntroduction";
import { StoredWork } from "@/components/StoredWork";
import { defaultFilters } from "@/lib/mock-data";
import type { SearchFilters as SearchFiltersType, ViewMode } from "@/lib/types";
import type { Company } from "@/types/company";
import type { DisclosureProcessingStage, DisclosureSearchResult } from "@/types/disclosure";
import { searchDisclosureDocuments } from "@/services/disclosure-search-client";

export default function Home() {
  const [filters, setFilters] = useState<SearchFiltersType>(defaultFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("vertical");
  const [expanded, setExpanded] = useState(true);
  const [activeMenu, setActiveMenu] = useState("주석 검색");
  const [results, setResults] = useState<DisclosureSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [stage, setStage] = useState<DisclosureProcessingStage>("공시보고서 검색 중");

  const runSearch = async () => {
    const selectedCompanies = [filters.baseCompany, ...filters.comparisonCompanies].filter((company): company is Company => Boolean(company?.corpCode));
    setHasSearched(true);
    setSearchError("");
    setResults([]);
    if (selectedCompanies.length === 0) {
      setSearchError("기준기업 또는 비교기업을 한 곳 이상 선택해 주세요.");
      return;
    }

    setIsSearching(true);
    setStage("공시보고서 검색 중");
    const stages: DisclosureProcessingStage[] = ["공시 원문 다운로드 중", "문서 목록 확인 중", "주석 문서 분석 중", "관련 주석 검색 중"];
    let index = 0;
    const timer = window.setInterval(() => {
      setStage(stages[index] ?? "관련 주석 검색 중");
      index += 1;
    }, 900);

    try {
      const searched = await searchDisclosureDocuments({
        companies: selectedCompanies.map(({ corpCode, corpName, stockCode }) => ({ corpCode, corpName, stockCode })),
        fiscalYear: filters.year,
        reportType: filters.reportType,
        noteTopic: filters.topic,
      });
      setResults(searched);
      setStage("완료");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "공시자료 검색에 실패했습니다.");
    } finally {
      window.clearInterval(timer);
      setIsSearching(false);
    }
  };

  return <AppShell activeMenu={activeMenu} onMenuChange={setActiveMenu} results={results}><main className="min-w-0 bg-[#f8fafc]">{activeMenu === "서비스 소개" ? <ServiceIntroduction /> : activeMenu !== "주석 검색" ? <div className="px-8 py-7"><StoredWork view={activeMenu as "저장된 작업" | "최근 검색" | "즐겨찾기"} onOpenSearch={() => setActiveMenu("주석 검색")} /></div> : <div className="mx-auto max-w-[1500px] px-8 py-7"><header className="mb-6 border-b border-slate-200 pb-5"><p className="mb-2 text-xs font-semibold tracking-[0.12em] text-blue-700">DISCLOSURE RESEARCH</p><h1 className="text-[26px] font-semibold tracking-tight text-slate-950">동종기업 주석 비교</h1><p className="mt-2 text-sm text-slate-600">비교기업의 사업보고서에서 관련 재무제표 주석을 찾아 한 화면에서 검토합니다.</p></header><SearchFilters filters={filters} onChange={setFilters} onReset={() => { setFilters(defaultFilters); setHasSearched(false); setResults([]); setSearchError(""); }} onSearch={runSearch} onSave={() => { const stored = JSON.parse(localStorage.getItem("note-saved-filters") ?? "[]") as SearchFiltersType[]; localStorage.setItem("note-saved-filters", JSON.stringify([filters, ...stored])); }} />{hasSearched && <section className="mt-7">{isSearching && <div role="status" className="mb-4 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"><span className="font-semibold">{stage}</span><span className="ml-2 text-blue-700">기업별 공시자료를 순차적으로 확인하고 있습니다.</span></div>}{!isSearching && searchError && <p role="alert" className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{searchError}</p>}{!isSearching && results.length > 0 && <><SearchResultToolbar resultCount={results.length} year={filters.year} viewMode={viewMode} expanded={expanded} onViewModeChange={setViewMode} onExpandedChange={setExpanded} /><DisclosureResult results={results} viewMode={viewMode} expanded={expanded} /></>}</section>}</div>}</main></AppShell>;
}
