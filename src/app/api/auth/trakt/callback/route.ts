import { NextRequest, NextResponse } from "next/server";
import { exchangeTraktCode, getTraktProfile } from "@/lib/trakt";
import { saveTraktTokens } from "@/services/db";

/**
 * Trakt OAuth2 Callback Route
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Expected to be the userId for simplicity

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    // 1. Exchange OAuth Code for Tokens
    const tokens = await exchangeTraktCode(code);
    if (!tokens || !tokens.access_token) {
        throw new Error("Trakt Exchange Failed");
    }

    // 2. Load Trakt Profile to get current username
    const profile = await getTraktProfile(tokens.access_token);
    const enrichedTokens = {
        ...tokens,
        username: profile?.username || "Trakt User",
        updatedAt: Date.now()
    };

    // 3. Save to Firebase (state = userId or trakt:userId)
    const userId = state.startsWith('trakt:') ? state.replace('trakt:', '') : state;
    await saveTraktTokens(userId, enrichedTokens);

    // 4. Handle Response based on request type
    const isJsonRequest = req.headers.get("accept")?.includes("application/json") || searchParams.has("json");
    if (isJsonRequest) {
        return NextResponse.json({ success: true, username: enrichedTokens.username });
    }

    // Default: Redirect back to settings page
    return NextResponse.redirect(new URL("/settings", req.url));
  } catch (error: any) {
    console.error("Trakt OAuth Error:", error);
    const isJsonRequest = req.headers.get("accept")?.includes("application/json") || searchParams.has("json");
    if (isJsonRequest) {
        return NextResponse.json({ error: error.message || "Trakt OAuth Error" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/settings?error=trakt", req.url));
  }
}
