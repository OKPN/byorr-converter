// functions/_middleware.js
// Cloudflare Pages Function Middleware: 静的ファイル 404 / SPA フォールバック時のスマート中継 (Catbox風ハイブリッド404)

const CATBOX_404_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - File Not Found</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f7f8;
      background-image: 
        repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.02) 0, rgba(0, 0, 0, 0.02) 1px, transparent 0, transparent 8px),
        repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.02) 0, rgba(0, 0, 0, 0.02) 1px, transparent 0, transparent 8px);
      color: #222;
      text-align: center;
      padding: 24px 16px;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 480px;
      width: 100%;
    }
    .error-code {
      font-size: 76px;
      font-weight: 700;
      color: #2b2e35;
      line-height: 1;
      letter-spacing: 2px;
      margin-bottom: 2px;
    }
    .question-mark {
      font-size: 28px;
      font-weight: 800;
      color: #00bcd4;
      line-height: 1;
      margin-bottom: 12px;
      user-select: none;
    }
    .character-img {
      display: block;
      width: 100%;
      max-width: 260px;
      height: auto;
      object-fit: contain;
      margin: 0 auto 20px auto;
      user-select: none;
      -webkit-user-drag: none;
    }
    .message {
      font-size: 15px;
      font-weight: 600;
      color: #2b2b2b;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .home-link {
      display: inline-block;
      padding: 7px 32px;
      border: 1.5px solid #2f7584;
      border-radius: 9999px;
      color: #4a3e7a;
      text-decoration: underline;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      background: transparent;
    }
    .home-link:hover {
      background: rgba(47, 117, 132, 0.08);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-code">404</div>
    <div class="question-mark">?</div>
    <img class="character-img" src="/404-character.webp" alt="404 Not Found" onerror="this.style.display='none'">
    <div class="message">The file you're looking for doesn't exist<br>or has been removed.</div>
    <a href="/" class="home-link">Click me to go home</a>
  </div>
</body>
</html>`;

const CATBOX_404_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="100%" height="100%" fill="#f7f7f8"/>
  <rect width="96%" height="94%" x="2%" y="3%" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 4" rx="8"/>
  <text x="50%" y="36%" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="56" font-weight="700" fill="#2b2e35" text-anchor="middle" letter-spacing="2">404</text>
  <text x="50%" y="50%" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="24" font-weight="800" fill="#00bcd4" text-anchor="middle">?</text>
  <!-- 猫耳シルエット -->
  <path d="M 182 188 Q 186 166 193 176 Q 200 171 207 176 Q 214 166 218 188 Z" fill="#2b2e35"/>
  <circle cx="194" cy="195" r="2.5" fill="#00bcd4"/>
  <circle cx="206" cy="195" r="2.5" fill="#00bcd4"/>
  <text x="50%" y="82%" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600" fill="#64748b" text-anchor="middle">FILE NOT FOUND OR REMOVED</text>
</svg>`;

function renderNotFoundResponse(request) {
  const accept = request.headers.get("accept") || "";
  // ブラウザで直接開いた場合（HTMLを要求）
  if (accept.includes("text/html")) {
    return new Response(CATBOX_404_HTML, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  // 掲示板や <img> タグ等から画像として呼び出された場合
  return new Response(CATBOX_404_SVG, {
    status: 404,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. 通常のリクエストを試行（HTML、静的アセット、/i/ など）
  const response = await context.next();

  // 静的アセット（404-character.webp など）はそのまま返却
  const filename = pathname.replace(/^\/+/, "");
  if (filename.startsWith("i/") || filename.startsWith("api/") || filename.startsWith("404-character.")) {
    return response;
  }

  // メディア拡張子（例: /sample.webp）かチェック
  const extMatch = pathname.match(/\.(webp|png|jpe?g|gif|jxl|avif|mp4|webm|zip)$/i);
  if (!extMatch) {
    return response; // メディア以外は通常レスポンスを返す
  }

  const contentType = response.headers.get("content-type") || "";
  // Pages が存在しない画像に対して SPA の index.html (200 OK, text/html) を返したケース、または 404 の場合に中継を試行
  const isSpaFallback = response.status === 200 && contentType.includes("text/html");
  if (response.status !== 404 && !isSpaFallback) {
    return response;
  }

  // 2. KV からファイル名に対応する IPFS CID を検索
  let targetCid = null;
  if (env && env.IPFS_KV) {
    try {
      targetCid = await env.IPFS_KV.get(filename);
    } catch (kvErr) {
      console.warn("IPFS_KV get error:", kvErr);
    }
  }

  // ターゲットパス: KV に CID があればそれを使い、無ければファイル名自体を探索
  const ipfsTarget = targetCid || filename;

  // 3. IPFS パブリックゲートウェイからフェッチ
  const primaryBase = "https://ipfs.filebase.io/ipfs";
  const fallbackBase = "https://ipfs.io/ipfs";

  let upstreamResponse = null;
  try {
    upstreamResponse = await fetch(`${primaryBase}/${ipfsTarget}`, {
      headers: {
        "User-Agent": "BYORR-KV-Relay/1.0",
        ...(request.headers.get("Range") ? { "Range": request.headers.get("Range") } : {}),
      },
      cf: { cacheEverything: true, cacheTtl: 86400 * 30 },
    });

    if (!upstreamResponse.ok) {
      upstreamResponse = await fetch(`${fallbackBase}/${ipfsTarget}`, {
        headers: {
          "User-Agent": "BYORR-KV-Relay/1.0",
          ...(request.headers.get("Range") ? { "Range": request.headers.get("Range") } : {}),
        },
        cf: { cacheEverything: true, cacheTtl: 86400 * 30 },
      });
    }
  } catch (err) {
    return renderNotFoundResponse(request);
  }

  if (!upstreamResponse || !upstreamResponse.ok) {
    return renderNotFoundResponse(request);
  }

  // 4. レスポンスヘッダー構築（完全サニタイズ：CID・IPFS・Filebaseの痕跡をすべて遮断）
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  const acceptRanges = upstreamResponse.headers.get("accept-ranges");
  if (acceptRanges) {
    headers.set("Accept-Ranges", acceptRanges);
  }

  const mimeMap = {
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    jxl: "image/jxl",
    avif: "image/avif",
    mp4: "video/mp4",
    webm: "video/webm",
    zip: "application/zip",
  };
  const ext = extMatch[1].toLowerCase();
  headers.set("Content-Type", mimeMap[ext] || upstreamResponse.headers.get("content-type") || "application/octet-stream");

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  });
}
