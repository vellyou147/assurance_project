import type { Company } from "@/types/company";

export async function searchCompanies(query: string): Promise<Company[]> {
  const response = await fetch(`/api/companies?q=${encodeURIComponent(query)}`);
  if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message ?? "기업 검색 결과를 불러오지 못했습니다."); }
  return response.json() as Promise<Company[]>;
}
