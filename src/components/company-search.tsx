"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { searchCompanies } from "@/services/company-service";
import type { Company } from "@/types/company";

export function CompanySearch({ id, placeholder, onSelect, excludeCorpCodes = [], compact = false }: { id: string; placeholder: string; onSelect: (company: Company) => void; excludeCorpCodes?: string[]; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      const reset = window.setTimeout(() => { setResults([]); setState("idle"); setErrorMessage(""); }, 0);
      return () => window.clearTimeout(reset);
    }
    const timer = window.setTimeout(async () => {
      setState("loading");
      setErrorMessage("");
      try {
        const found = (await searchCompanies(normalized)).filter((company) => !excludeCorpCodes.includes(company.corpCode));
        setResults(found);
        setState(found.length === 0 ? "empty" : "idle");
      } catch (error) {
        setResults([]);
        setErrorMessage(error instanceof Error ? error.message : "기업 검색 중 오류가 발생했습니다.");
        setState("error");
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, excludeCorpCodes]);

  const select = (company: Company) => { onSelect(company); setQuery(""); setResults([]); setState("idle"); };
  return <div className="relative"><div className="flex h-10 items-center rounded-md border border-slate-300 bg-white px-2"><Search className="mr-1.5 h-4 w-4 shrink-0 text-slate-400" /><input id={id} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} autoComplete="off" className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400 ${compact ? "text-xs placeholder:text-[11px]" : "text-sm"}`} />{state === "loading" && <LoaderCircle className="h-4 w-4 animate-spin text-blue-700" />}</div>{query.trim().length >= 2 && (state === "loading" || state === "empty" || state === "error" || results.length > 0) && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-200/50">{state === "loading" && <p className="px-3 py-2.5 text-xs text-slate-500">기업을 검색하고 있습니다.</p>}{state === "empty" && <p className="px-3 py-2.5 text-xs text-slate-500">검색 결과가 없습니다.</p>}{state === "error" && <p role="alert" className="px-3 py-2.5 text-xs leading-5 text-red-600">{errorMessage}</p>}{results.map((company) => <button type="button" key={company.corpCode} onClick={() => select(company)} className="flex w-full items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50"><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{company.corpName}</span><span className="mt-0.5 block font-mono text-[11px] text-slate-500">{company.stockCode ?? "종목코드 없음"}</span></span><span className={company.isListed ? "shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700" : "shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500"}>{company.isListed ? "상장" : "비상장"}</span></button>)}</div>}<p className="mt-1 text-[11px] text-slate-500">두 글자 이상 입력하면 기업을 검색합니다.</p></div>;
}
