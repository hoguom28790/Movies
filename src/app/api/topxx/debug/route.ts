import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "mdIwhEBvYj";
  const log: string[] = [];

  try {
    const apiUrl = `https://topxx.vip/api/v1/movies/${slug}`;
    log.push(`Fetching: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://topxx.vip/'
      },
      signal: AbortSignal.timeout(10000)
    });

    log.push(`HTTP Status: ${res.status}`);
    log.push(`Content-Type: ${res.headers.get('content-type')}`);

    const text = await res.text();
    log.push(`Response length: ${text.length}`);
    log.push(`Response preview: ${text.substring(0, 300)}`);

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
      log.push(`JSON parse: SUCCESS`);
      log.push(`API status: ${parsed?.status}`);
      log.push(`Has data: ${!!parsed?.data}`);
      log.push(`Sources count: ${parsed?.data?.sources?.length ?? 'N/A'}`);
      if (parsed?.data?.sources) {
        log.push(`Sources: ${JSON.stringify(parsed.data.sources)}`);
      }
    } catch (e) {
      log.push(`JSON parse FAILED: ${String(e)}`);
    }

    return NextResponse.json({ log, parsed: parsed?.data ? { status: parsed.status, sources: parsed.data.sources } : null });
  } catch (err) {
    log.push(`FETCH ERROR: ${String(err)}`);
    return NextResponse.json({ log, error: String(err) });
  }
}
