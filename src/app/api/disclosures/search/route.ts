import { NextRequest, NextResponse } from "next/server";
import { searchDisclosures } from "@/services/disclosure-search-service";
import type { DisclosureSearchRequest } from "@/types/disclosure";

export async function POST(request: NextRequest) {
  let input: DisclosureSearchRequest;
  try { input = await request.json() as DisclosureSearchRequest; } catch { return NextResponse.json({ message: "검색 조건 형식이 올바르지 않습니다." }, { status: 400 }); }
  if (!input.companies?.length || input.companies.length > 6 || !/^\d{4}$/.test(input.fiscalYear)) return NextResponse.json({ message: "검색할 기업과 사업연도를 확인하세요." }, { status: 400 });
  const results = await searchDisclosures(input);
  return NextResponse.json({ results });
}
