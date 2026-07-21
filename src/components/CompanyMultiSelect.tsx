"use client";

import { Plus, X } from "lucide-react";
import { CompanySearch } from "@/components/company-search";
import type { Company } from "@/types/company";

export function CompanyMultiSelect({ value, onChange }: { value: Company[]; onChange: (companies: Company[]) => void }) {
  return <div className="min-w-0"><div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5">{value.length > 0 ? value.map((company) => <span key={company.corpCode} className="inline-flex max-w-full items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"><span className="truncate">{company.corpName}</span><button type="button" aria-label={`${company.corpName} 제거`} onClick={() => onChange(value.filter((item) => item.corpCode !== company.corpCode))} className="rounded text-slate-400 hover:text-slate-800"><X className="h-3 w-3" /></button></span>) : <span className="px-1 text-xs text-slate-500">선택된 비교기업이 없습니다.</span>}</div>{value.length < 5 && <div className="mt-2"><CompanySearch id="comparison-company-search" placeholder="예: SK하이닉스 또는 000660" excludeCorpCodes={value.map((company) => company.corpCode)} onSelect={(company) => onChange([...value, company])} /></div>}<p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500"><Plus className="h-3 w-3" />최대 5개 기업 선택 가능</p></div>;
}
