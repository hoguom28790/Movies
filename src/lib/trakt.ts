/**
 * Trakt.tv API Utility Library
 * Handles: OAuth2, Search/Matching, Scrobbling, and Watched Status
 */

const TRAKT_API_URL = "https://api.trakt.tv";
const CLIENT_ID = (process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID || "").trim();
const CLIENT_SECRET = (process.env.TRAKT_CLIENT_SECRET || "").trim();
const REDIRECT_URI = (process.env.NEXT_PUBLIC_TRAKT_REDIRECT_URI || "").trim();

export interface TraktAuth {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: number;
  username?: string;
}

export type TraktType = "movie" | "show" | "episode";

/**
 * Get Authentication Headers
 */
const getHeaders = (accessToken?: string) => ({
  "Content-Type": "application/json",
  "trakt-api-version": "2",
  "trakt-api-key": CLIENT_ID,
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

/**
 * Metadata Bridge: Match OPhim/KKPhim Title to Trakt ID
 * Uses fuzzy search with year filtering for better accuracy.
 */
export async function matchTraktContent(title: string, year?: number, type: TraktType = "movie") {
    // Clean Vietnamese noise if needed, but Trakt is decent at fuzzy matching
    const query = encodeURIComponent(title.trim());
    const url = `${TRAKT_API_URL}/search/${type}?query=${query}${year ? `&years=${year}` : ""}`;
    
    try {
        const res = await fetch(url, { headers: getHeaders() });
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
            // Pick most relevant match (usually the first one)
            const match = data[0];
            return {
                type: match.type,
                ids: match[match.type]?.ids || null,
                title: match[match.type]?.title || "",
                year: match[match.type]?.year || 0
            };
        }
        return null;
    } catch (e) {
        console.error("Trakt Match Error:", e);
        return null;
    }
}

/**
 * Scrobble: Start (1%)
 */
export async function scrobbleStart(accessToken: string, item: any, progress: number = 0) {
    return scrobbleAction("start", accessToken, item, progress);
}

/**
 * Scrobble: Pause
 */
export async function scrobblePause(accessToken: string, item: any, progress: number) {
    return scrobbleAction("pause", accessToken, item, progress);
}

/**
 * Scrobble: Stop (90%+)
 */
export async function scrobbleStop(accessToken: string, item: any, progress: number = 90) {
    return scrobbleAction("stop", accessToken, item, progress);
}

async function scrobbleAction(action: "start" | "pause" | "stop", accessToken: string, item: any, progress: number) {
    const body: any = {
        progress,
        app_version: "1.0",
        app_date: new Date().toISOString().split("T")[0]
    };

    if (item.type === "movie") {
        body.movie = { ids: item.ids };
    } else {
        body.episode = { ids: item.ids };
    }

    try {
        const res = await fetch(`${TRAKT_API_URL}/scrobble/${action}`, {
            method: "POST",
            headers: getHeaders(accessToken),
            body: JSON.stringify(body)
        });
        return res.ok;
    } catch (e) {
        return false;
    }
}

/**
 * Exchange OAuth Code for Tokens
 */
export async function exchangeTraktCode(code: string) {
    const requestPayload = {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code"
    };

    console.log("Trakt Exchange Request:", {
        ...requestPayload,
        client_secret: CLIENT_SECRET ? `${CLIENT_SECRET.substring(0, 4)}***${CLIENT_SECRET.substring(CLIENT_SECRET.length - 4)}` : null
    });

    try {
        const res = await fetch(`${TRAKT_API_URL}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload)
        });
        const data = await res.json();
        console.log("Trakt Exchange Response:", data);
        return data;
    } catch (e) {
        console.error("Trakt OAuth Error:", e);
        return null;
    }
}

/**
 * Refresh Expired Token
 */
export async function refreshTraktToken(refreshToken: string) {
    const body = {
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "refresh_token"
    };

    try {
        const res = await fetch(`${TRAKT_API_URL}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}

/**
 * Check if User has Watched a Content (Two-way sync)
 */
export async function checkWatchedStatus(accessToken: string, type: TraktType, ids: any) {
    const url = type === "movie" 
        ? `${TRAKT_API_URL}/sync/watched/movies`
        : `${TRAKT_API_URL}/sync/watched/shows`;
        
    try {
        const res = await fetch(url, { headers: getHeaders(accessToken) });
        const list = await res.json();
        
        if (type === "movie") {
            return list.some((item: any) => item.movie.ids.trakt === ids.trakt);
        } else {
            // Simplified: check if show exists in watched list
            return list.some((item: any) => item.show.ids.trakt === ids.trakt);
        }
    } catch (e) {
        return false;
    }
}

/**
 * Get Current Trakt Profile
 */
export async function getTraktProfile(accessToken: string) {
    try {
        const res = await fetch(`${TRAKT_API_URL}/users/me`, {
            headers: getHeaders(accessToken)
        });
        return await res.json();
    } catch (e) {
        return null;
    }
}
