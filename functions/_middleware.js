// functions/_middleware.js
// Cloudflare Pages Function Middleware: 静的ファイル 404 / SPA フォールバック時のスマート中継 (KV 連携 ＆ CID隠蔽)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. 通常のリクエストを試行（HTML、静的アセット、/i/ など）
  const response = await context.next();

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

  const filename = pathname.replace(/^\/+/, "");
  // もし /i/ や /api/ 自体だった場合は何もしない
  if (filename.startsWith("i/") || filename.startsWith("api/")) {
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
    return new Response("404 Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  if (!upstreamResponse || !upstreamResponse.ok) {
    return new Response("404 Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
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
