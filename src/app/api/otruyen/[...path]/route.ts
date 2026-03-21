import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    
    // Construct the target URL
    const apiUrl = `https://otruyenapi.com/v1/api/${path}${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour to reduce API hits
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`OTruyen API responded with status: ${response.status}`);
      return NextResponse.json(
        { error: "OTruyen API Error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("OTruyen Proxy Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error during OTruyen fetch" },
      { status: 500 }
    );
  }
}
