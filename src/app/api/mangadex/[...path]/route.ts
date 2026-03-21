import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const url = new URL(request.url);
    
    // Always enforce Vietnamese language for MangaDex fallback
    url.searchParams.set("translatedLanguage[]", "vi");
    const searchParams = url.searchParams.toString();
    
    // Construct the target URL
    const apiUrl = `https://api.mangadex.org/${path}?${searchParams}`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 },
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`MangaDex API responded with status: ${response.status}`);
      return NextResponse.json(
        { error: "MangaDex API Error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("MangaDex Proxy Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error during MangaDex fetch" },
      { status: 500 }
    );
  }
}
