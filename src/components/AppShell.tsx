import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import type { DisclosureSearchResult } from "@/types/disclosure";

export function AppShell({ children, activeMenu, onMenuChange, results }: { children: ReactNode; activeMenu: string; onMenuChange: (item: string) => void; results: DisclosureSearchResult[] }) {
  return <div className="flex min-h-screen bg-slate-50"><Sidebar active={activeMenu} onChange={onMenuChange} />{children}{activeMenu === "주석 검색" && <ComparisonPanel results={results} />}</div>;
}
