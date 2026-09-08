// functions/_middleware.js
// Cloudflare Pages Function Middleware: 静的ファイル 404 / SPA フォールバック時のスマート中継 (Catbox風ハイブリッド404 & パスワード保護ゲート)

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

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      list[parts.shift().trim()] = decodeURIComponent(parts.join("=").trim());
    }
  });
  return list;
}

async function verifyPassword(inputPassword, meta) {
  if (!inputPassword || !meta) return false;
  if (meta.password && inputPassword === meta.password) return true;

  if (meta.passwordHash && meta.passwordSalt) {
    try {
      const saltBytes = new Uint8Array(meta.passwordSalt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(inputPassword),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: saltBytes,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        256
      );
      const hashHex = Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      return hashHex === meta.passwordHash;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function renderPasswordForm(filename, errorMsg = "") {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>保護されたファイル - Access Restricted</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #121316;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #1e2025;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px 24px;
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .icon { font-size: 48px; margin-bottom: 12px; }
    h1 { font-size: 18px; margin-bottom: 8px; color: #ffffff; }
    .filename {
      font-size: 13px;
      color: #38bdf8;
      word-break: break-all;
      margin-bottom: 16px;
      font-family: monospace;
      background: rgba(56, 189, 248, 0.1);
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-block;
    }
    p { font-size: 13px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
    input[type="password"] {
      width: 100%;
      height: 44px;
      background: #121316;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #ffffff;
      padding: 0 16px;
      font-size: 16px;
      outline: none;
      margin-bottom: 12px;
      text-align: center;
      letter-spacing: 2px;
    }
    input[type="password"]:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
    button {
      width: 100%;
      height: 44px;
      background: #6366f1;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #4f46e5; }
    .error {
      color: #f43f5e;
      font-size: 13px;
      margin-top: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>保護されたファイル</h1>
    <div class="filename">${filename}</div>
    <p>このファイルを閲覧するには合言葉（パスワード）が必要です。</p>
    <form method="POST" action="">
      <input type="password" name="pwd" placeholder="🔑 合言葉を入力" autofocus required autocomplete="off">
      <button type="submit">閲覧する</button>
    </form>
    ${errorMsg ? `<div class="error">⚠️ ${errorMsg}</div>` : ""}
  </div>
</body>
</html>`;
}

function renderNotFoundResponse(request) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return new Response(CATBOX_404_HTML, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

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

  const response = await context.next();

  const filename = pathname.replace(/^\/+/, "");
  if (filename.startsWith("i/") || filename.startsWith("api/") || filename.startsWith("404-character.")) {
    return response;
  }

  const extMatch = pathname.match(/\.(webp|png|jpe?g|gif|jxl|avif|mp4|webm|zip)$/i);
  if (!extMatch) {
    return response;
  }

  const contentType = response.headers.get("content-type") || "";
  const isSpaFallback = response.status === 200 && contentType.includes("text/html");
  if (response.status !== 404 && !isSpaFallback) {
    return response;
  }

  let targetCid = null;
  let meta = {};
  if (env && env.IPFS_KV) {
    try {
      const kvRes = await env.IPFS_KV.getWithMetadata(filename);
      if (kvRes) {
        targetCid = kvRes.value;
        meta = kvRes.metadata || {};
      }
    } catch (kvErr) {
      console.warn("IPFS_KV get error:", kvErr);
    }
  }

  // ⏳ 時限アップロードの有効期限チェック（期限切れは即座に404）
  if (meta.expiresAt && Date.now() > Number(meta.expiresAt)) {
    return renderNotFoundResponse(request);
  }

  // 🔒 パスワード保護の検証ゲート
  const hasPassword = Boolean(meta.password || meta.passwordHash);
  if (hasPassword) {
    const cookies = parseCookies(request.headers.get("Cookie"));
    const cookieKey = "auth_" + encodeURIComponent(filename);
    const authCookie = cookies[cookieKey];

    const isSessionAuthed = Boolean(authCookie && meta.sessionSecret && authCookie === meta.sessionSecret);

    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        const pwd = formData.get("pwd");
        if (await verifyPassword(pwd, meta)) {
          const secret = meta.sessionSecret || ("sec_" + Math.random().toString(36).slice(2));
          return new Response(null, {
            status: 302,
            headers: {
              "Location": request.url,
              "Set-Cookie": `${cookieKey}=${encodeURIComponent(secret)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
            },
          });
        } else {
          return new Response(renderPasswordForm(filename, "合言葉（パスワード）が正しくありません"), {
            status: 403,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "private, no-cache, no-store",
            },
          });
        }
      } catch (postErr) {
        return new Response(renderPasswordForm(filename, "入力処理でエラーが発生しました"), {
          status: 400,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "private, no-cache, no-store",
          },
        });
      }
    }

    if (!isSessionAuthed) {
      return new Response(renderPasswordForm(filename), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-cache, no-store",
          "Vary": "Cookie",
        },
      });
    }
  }

  // 3. KV に実データ（blobKey または blob_<filename>）が直接格納されている場合は即時配信
  if (env && env.IPFS_KV) {
    try {
      const blobKey = meta.blobKey || ("blob_" + filename);
      const directData = await env.IPFS_KV.get(blobKey, "arrayBuffer");
      if (directData) {
        const headers = new Headers();
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
        headers.set("X-Content-Type-Options", "nosniff");
        const ONE_HOUR_SECONDS = 3600;
        if (hasPassword) {
          headers.set("Cache-Control", `private, max-age=${ONE_HOUR_SECONDS}`);
          headers.set("Cloudflare-CDN-Cache-Control", "private, no-store");
          headers.set("Vary", "Cookie, Accept-Encoding");
        } else {
          headers.set("Cache-Control", `public, max-age=${ONE_HOUR_SECONDS}`);
          headers.set("Cloudflare-CDN-Cache-Control", `public, max-age=${ONE_HOUR_SECONDS}`);
          headers.set("Vary", "Accept-Encoding");
        }
        headers.set("Content-Length", String(directData.byteLength));
        const mimeMap = {
          webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
          gif: "image/gif", jxl: "image/jxl", avif: "image/avif", mp4: "video/mp4",
          webm: "video/webm", zip: "application/zip",
        };
        const ext = extMatch[1].toLowerCase();
        headers.set("Content-Type", meta.mime || mimeMap[ext] || "application/octet-stream");
        return new Response(directData, { status: 200, headers });
      }
    } catch (directErr) {
      console.warn("Direct blob read error:", directErr);
    }
  }

  // 候補ターゲット（CID、S3Key、ファイル名）を順次試行
  const candidates = [];
  if (targetCid) candidates.push(targetCid);
  if (meta.s3Key && !candidates.includes(meta.s3Key)) candidates.push(meta.s3Key);
  if (!candidates.includes(filename)) candidates.push(filename);

  const primaryBase = "https://ipfs.filebase.io/ipfs";
  const fallbackBase = "https://ipfs.io/ipfs";

  let upstreamResponse = null;
  for (const candidate of candidates) {
    try {
      upstreamResponse = await fetch(`${primaryBase}/${candidate}`, {
        headers: {
          "User-Agent": "BYORR-KV-Relay/1.0",
          ...(request.headers.get("Range") ? { "Range": request.headers.get("Range") } : {}),
        },
        cf: { cacheEverything: !hasPassword, cacheTtl: hasPassword ? 0 : 86400 * 30 },
      });

      if (!upstreamResponse.ok) {
        upstreamResponse = await fetch(`${fallbackBase}/${candidate}`, {
          headers: {
            "User-Agent": "BYORR-KV-Relay/1.0",
            ...(request.headers.get("Range") ? { "Range": request.headers.get("Range") } : {}),
          },
          cf: { cacheEverything: !hasPassword, cacheTtl: hasPassword ? 0 : 86400 * 30 },
        });
      }

      if (upstreamResponse && upstreamResponse.ok) {
        break;
      }
    } catch (err) {
      console.warn(`Upstream fetch attempt failed for ${candidate}:`, err);
    }
  }

  if (!upstreamResponse || !upstreamResponse.ok) {
    return renderNotFoundResponse(request);
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
  headers.set("X-Content-Type-Options", "nosniff");

  const ONE_HOUR_SECONDS = 3600;
  if (hasPassword) {
    headers.set("Cache-Control", `private, max-age=${ONE_HOUR_SECONDS}`);
    headers.set("Cloudflare-CDN-Cache-Control", "private, no-store");
    headers.set("Vary", "Cookie, Accept-Encoding");
  } else {
    headers.set("Cache-Control", `public, max-age=${ONE_HOUR_SECONDS}`);
    headers.set("Cloudflare-CDN-Cache-Control", `public, max-age=${ONE_HOUR_SECONDS}`);
    headers.set("Vary", "Accept-Encoding");
  }

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
