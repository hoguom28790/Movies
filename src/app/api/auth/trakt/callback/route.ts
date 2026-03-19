import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Popup HTML templates
  const renderPopup = (title: string, message: string, script?: string) => `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { background: #000; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; }
        .spinner { border: 4px solid rgba(255,255,255,0.1); border-left-color: #E50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div>
        ${message}
      </div>
      <script>${script || ""}</script>
    </body>
    </html>
  `;

  if (error) {
    return new NextResponse(
      renderPopup("Lỗi Trakt", "<h1>Xác thực thất bại</h1><p>Bạn đã từ chối cấp quyền.</p>", "setTimeout(() => window.close(), 3000);"),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (!code) {
    return new NextResponse(
      renderPopup("Lỗi", "<h1>Thiếu mã xác thực</h1><p>Không tìm thấy code.</p>", "setTimeout(() => window.close(), 3000);"),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Exchange code for token
  const clientId = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID;
  const clientSecret = process.env.TRAKT_CLIENT_SECRET;
  
  // Clean redirect URI without search params (Trakt is very strict about EXACT string match)
  const redirectUri = `${origin}/api/auth/trakt/callback`;

  try {
    const response = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Trakt Token Error:", err);
      return new NextResponse(
        renderPopup("Lỗi", "<h1>Đổi mã thất bại</h1><p>Trakt từ chối mã xác thực.</p>", "setTimeout(() => window.close(), 3000);"),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const data = await response.json();
    
    // We send this safely back to the parent window that opened this popup!
    const successScript = `
      if (window.opener) {
        window.opener.postMessage(
          { 
            type: "TRAKT_AUTH_SUCCESS", 
            tokens: {
              access_token: "${data.access_token}",
              refresh_token: "${data.refresh_token}",
              created_at: ${data.created_at},
              expires_in: ${data.expires_in}
            } 
          }, 
          "*"
        );
      }
      setTimeout(() => window.close(), 1000);
    `;

    return new NextResponse(
      renderPopup("Thành công", "<div class='spinner'></div><h2>Đang liên kết với Trakt...</h2>", successScript),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );

  } catch (err) {
    console.error("Trakt Auth error:", err);
    return new NextResponse(
      renderPopup("Lỗi", "<h1>Lỗi hệ thống</h1>", "setTimeout(() => window.close(), 3000);"),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
