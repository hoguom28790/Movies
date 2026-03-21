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

    const requestPayload = {
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
    };

    console.log("AniList Exchange Request:", {
        ...requestPayload,
        client_secret: clientSecret ? `${clientSecret.substring(0, 4)}***${clientSecret.substring(clientSecret.length - 4)}` : null
    });

    const response = await fetch("https://anilist.co/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await response.json();
    console.log("AniList Exchange Response:", data);
    if (data.error) {
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AniList exchange failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
