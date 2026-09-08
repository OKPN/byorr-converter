// functions/_middleware.js
// Cloudflare Pages Function Middleware: 静的ファイル 404 時のスマート中継フォールバック

export async function onRequest(context) {
  const { request } = context;
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
  // もし /i/ 自体が404だった場合は何もしない
  if (filename.startsWith("i/")) {
    return response;
  }

  // 3. IPFS パブリックゲートウェイからファイル名、または IPFS ハッシュ探索
  const primaryBase = "https://ipfs.filebase.io/ipfs";
  const fallbackBase = "https://ipfs.io/ipfs";

  let upstreamResponse = null;
  try {
    upstreamResponse = await fetch(`${primaryBase}/${filename}`, {
      headers: { "User-Agent": "BYORR-Direct-Fallback/1.0" },
      cf: { cacheEverything: true, cacheTtl: 86400 * 30 },
    });

    if (!upstreamResponse.ok) {
      upstreamResponse = await fetch(`${fallbackBase}/${filename}`, {
        headers: { "User-Agent": "BYORR-Direct-Fallback/1.0" },
        cf: { cacheEverything: true, cacheTtl: 86400 * 30 },
      });
    }
  } catch (err) {
    return response;
  }

  if (!upstreamResponse || !upstreamResponse.ok) {
    return response;
  }

  // 4. レスポンスヘッダー構築
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
