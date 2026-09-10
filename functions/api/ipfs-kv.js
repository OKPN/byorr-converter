// functions/api/ipfs-kv.js
// Cloudflare Pages Function: ファイル名と IPFS CID の KV 登録・照会・削除・一覧 API

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// GET: 単一キーの照会、または全キーの一覧取得
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!env || !env.IPFS_KV) {
    return new Response(JSON.stringify({ error: "IPFS_KV binding not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // 1. key パラメータがない場合は、KV に登録されている全キーの一覧を返却
  if (!key) {
    try {
      const list = await env.IPFS_KV.list({ limit: 1000 });
      const items = (list.keys || []).map(k => ({
        name: k.name,
        metadata: k.metadata || {},
      }));
      return new Response(JSON.stringify({ success: true, files: items }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }

  // 2. key パラメータがある場合は単一照会
  try {
    const value = await env.IPFS_KV.getWithMetadata(key);
    if (!value || !value.value) {
      return new Response(JSON.stringify({ found: false, key }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    return new Response(JSON.stringify({
      found: true,
      key,
      cid: value.value,
      metadata: value.metadata || {},
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

// POST: キーと CID の登録（メタデータ対応）
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env || !env.IPFS_KV) {
    return new Response(JSON.stringify({ error: "IPFS_KV binding not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  // サーバー側サイズガード: クライアント側チェックのすり抜け防止
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 80 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "File too large (Max: 80MB)" }), {
      status: 413,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await request.json();
    const { key, cid, size, mime, lastModified, password, dataBase64, ttl, expiresAt } = body;

    if (!key) {
      return new Response(JSON.stringify({ error: "Missing 'key' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const safeCid = cid || "";

    // パスワードが指定されている場合は PBKDF2 でハッシュ化
    let passwordMeta = {};
    if (password && typeof password === "string" && password.trim().length > 0) {
      const cleanPwd = password.trim();
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(cleanPwd),
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
      const saltHex = Array.from(saltBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      const sessionSecret = "sec_" + Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      passwordMeta = {
        passwordHash: hashHex,
        passwordSalt: saltHex,
        sessionSecret,
      };
    } else {
      // パスワードが未指定の場合、既存レコードのパスワード設定を維持する
      try {
        const existing = await env.IPFS_KV.getWithMetadata(key);
        if (existing && existing.metadata && existing.metadata.passwordHash) {
          passwordMeta = {
            passwordHash: existing.metadata.passwordHash,
            passwordSalt: existing.metadata.passwordSalt,
            sessionSecret: existing.metadata.sessionSecret,
          };
        }
      } catch (e) {}
    }

    const calculatedExpiresAt = expiresAt || (ttl && Number(ttl) > 0 ? Date.now() + Number(ttl) * 1000 : null);

    const metadata = {
      cid: safeCid,
      size: size || 0,
      mime: mime || "",
      lastModified: lastModified || Date.now(),
      registeredAt: Date.now(),
      s3Key: body.s3Key || key,
      unpinned: Boolean(body.unpinned),
      ...(calculatedExpiresAt ? { expiresAt: calculatedExpiresAt, ttl: Number(ttl) } : {}),
      ...passwordMeta,
    };

    // KV に登録 (value: safeCid, metadata, expirationTtl)
    const putOptions = { metadata };
    if (ttl && Number(ttl) > 0) {
      putOptions.expirationTtl = Math.max(60, Number(ttl));
    }
    await env.IPFS_KV.put(key, safeCid, putOptions);

    // 🚀 URL再利用・即時反映: 直前までの404エッジキャッシュを即時パージ
    context.waitUntil?.(purgeHybridCache(request, env, key)) || purgeHybridCache(request, env, key);

    return new Response(JSON.stringify({ success: true, key, cid: safeCid, metadata }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

// DELETE: キーの削除（リンク抹消 / 遮断）
export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!env || !env.IPFS_KV) {
    return new Response(JSON.stringify({ error: "IPFS_KV binding not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!key) {
    return new Response(JSON.stringify({ error: "Missing 'key' query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const existing = await env.IPFS_KV.getWithMetadata(key);
    if (existing?.metadata?.blobKey) {
      await env.IPFS_KV.delete(existing.metadata.blobKey).catch(() => {});
    } else {
      await env.IPFS_KV.delete("blob_" + key).catch(() => {});
    }
    await env.IPFS_KV.delete(key);

    // 🚀 リンク抹消: エッジに残っている画像キャッシュを即座に消滅させる
    context.waitUntil?.(purgeHybridCache(request, env, key)) || purgeHybridCache(request, env, key);

    return new Response(JSON.stringify({ success: true, deletedKey: key }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

// 🌐 ハイブリッド Cache Purge ヘルパー
// プランA (独自ドメイン設定時): REST Purge API で世界300箇所の全エッジから即時抹消
// プランB (pages.dev無料運用時): Cache API (caches.default) でローカルPoPから即時抹消
async function purgeHybridCache(request, env, key) {
  if (!key) return;
  const reqUrl = new URL(request.url);
  const targetPath = `/${encodeURIComponent(key)}`;
  const targetUrl = `${reqUrl.origin}${targetPath}`;

  // content-relay ドメインのURLも対象に含める
  const urlsToPurge = [targetUrl];
  if (!reqUrl.hostname.includes("content-relay")) {
    urlsToPurge.push(`https://content-relay.pages.dev${targetPath}`);
  }

  // 1. プランA: REST Purge API (独自ドメインの Zone ID & API Token がある場合)
  const zoneId = env.CLOUDFLARE_ZONE_ID;
  const purgeToken = env.CLOUDFLARE_PURGE_TOKEN || env.CLOUDFLARE_API_TOKEN;
  if (zoneId && purgeToken) {
    try {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${purgeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urlsToPurge }),
      });
    } catch (apiErr) {
      console.warn("REST Purge API error:", apiErr);
    }
  }

  // 2. プランB: Cache API (caches.default.delete) - pages.dev 環境でも動作
  try {
    if (typeof caches !== "undefined" && caches.default) {
      for (const u of urlsToPurge) {
        await caches.default.delete(u).catch(() => {});
      }
    }
  } catch (cacheErr) {
    console.warn("Cache API delete error:", cacheErr);
  }
}
