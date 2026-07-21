import { NextRequest, NextResponse } from "next/server";
import { OpenDartCompanyError, searchOpenDartCompanies } from "@/services/opendart-company-service";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const companies = await searchOpenDartCompanies(query);
    return NextResponse.json(companies);
  } catch (error) {
    if (error instanceof OpenDartCompanyError) return NextResponse.json({ message: error.message }, { status: error.status });
    return NextResponse.json({ message: "기업 검색 중 예상하지 못한 오류가 발생했습니다. 잠시 후 다시 시도하세요." }, { status: 500 });
  }
}
