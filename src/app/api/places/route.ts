import { NextResponse } from "next/server";
import {
  ChgisTimeoutError,
  ChgisUpstreamError,
  searchChgis,
} from "@/lib/chgis/client";
import { parseSearchQuery, QueryValidationError } from "@/lib/chgis/query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let parsed: ReturnType<typeof parseSearchQuery>;
  try {
    parsed = parseSearchQuery(new URL(request.url).searchParams);
  } catch (error) {
    const message = error instanceof QueryValidationError ? error.message : "请求无效。";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await searchChgis(parsed.query, parsed.year);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ChgisTimeoutError) {
      return NextResponse.json({ error: error.message }, { status: 504 });
    }
    if (error instanceof ChgisUpstreamError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "服务器处理请求时发生错误。" }, { status: 500 });
  }
}
