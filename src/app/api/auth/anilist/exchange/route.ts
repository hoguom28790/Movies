import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID?.trim();
    const clientSecret = process.env.ANILIST_CLIENT_SECRET?.trim();
    const redirectUri = process.env.NEXT_PUBLIC_ANILIST_REDIRECT_URI?.trim();

    const response = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AniList exchange failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
