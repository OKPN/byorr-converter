// functions/_middleware.js
// Cloudflare Pages Function Middleware: 静的ファイル 404 時のスマート中継フォールバック (KV 連携)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. 通常のリクエストを試行（HTML、静的アセット、/i/ など）
  const response = await context.next();
  if (response.status !== 404) {
    return response;
  }

  // 2. 404 の場合で、画像/メディア拡張子への直接アクセス（例: /sample.webp）かチェック
  const extMatch = pathname.match(/\.(webp|png|jpe?g|gif|jxl|avif|mp4|webm|zip)$/i);
  if (!extMatch) {
    return response; // メディア以外は通常の404を返す
  }

  const filename = pathname.replace(/^\/+/, "");
  // もし /i/ や /api/ 自体が404だった場合は何もしない
  if (filename.startsWith("i/") || filename.startsWith("api/")) {
    return response;
  }

  // 3. KV からファイル名に対応する IPFS CID を検索
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

  // 4. IPFS パブリックゲートウェイからフェッチ
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
    return response;
  }

  if (!upstreamResponse || !upstreamResponse.ok) {
    return response;
  }

  // 5. レスポンスヘッダー構築
  const headers = new Headers(upstreamResponse.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

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
  if (mimeMap[ext]) {
    headers.set("Content-Type", mimeMap[ext]);
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  });
}
