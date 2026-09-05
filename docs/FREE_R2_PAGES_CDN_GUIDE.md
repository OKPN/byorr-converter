# 🚀 Zero-Dollar R2 Image CDN via Cloudflare Pages (No Custom Domain Required)

> **The ultimate guide for indie hackers & AI creators**: Serve images and videos directly from your Cloudflare R2 bucket using clean, permanent `https://<project>.pages.dev` URLs — **100% free, zero domain registration fees, zero egress bandwidth costs, and full CORS support**.

---

## ⚡ The Problem: Why R2 Public Sharing Normally Sucks

When you want to share images or videos stored in Cloudflare R2 (for Civitai, Discord, Reddit, social media, or web apps), Cloudflare gives you two official options:

1. **Option A: R2 Public Bucket (`pub-xxx.r2.dev`)**
   - ⚠️ **Severely rate-limited**: Cloudflare throttles `r2.dev` subdomains heavily. Great for quick testing, but terrible for real-world traffic, embeds, or automated image ingestion.
2. **Option B: Custom Domain**
   - 💸 **Requires a paid domain**: You must purchase a domain (Namecheap, Cloudflare Registrar, etc.) and transfer your DNS nameservers to Cloudflare. Not ideal if you just want a free, disposable, or side-project media bucket without ongoing domain renewal costs.

---

## 💡 The Secret Weapon: Cloudflare Pages Relay (`_worker.js`)

Cloudflare Pages isn't just for static HTML blogs. In **Advanced Mode**, placing a single `_worker.js` script in your Pages project turns it into a **blazing-fast global edge proxy**:

- 🆓 **100% Free ($0.00 / month)**: No domain purchase, no DNS delegation needed.
- ⚡ **Worldwide CDN Edge Caching**: Served directly from hundreds of Cloudflare edge data centers with ultra-low latency.
- 🚀 **Zero Egress Bandwidth Fees**: Unlimited gigabytes/terabytes of image downloads without paying a single cent (Cloudflare R2's famous zero-egress promise).
- 🔓 **Universal CORS Enabled**: Returns `Access-Control-Allow-Origin: *` so external platforms (Civitai, web apps, Canvas) can load your images without errors.
- 🗜️ **Automatic Content-Type**: Maps extensions (`.webp`, `.jpg`, `.png`, `.mp4`) to proper MIME headers so files open directly in browsers instead of downloading as generic binaries.

---

## 🛠️ 3-Minute Quick Setup

You don't need GitHub, repositories, or complicated CI/CD pipelines. You can deploy this directly from your local terminal in under 3 minutes.

### Step 1: Create the Project Folder

Create an empty folder on your computer and add a single file named `_worker.js`:

```javascript
// _worker.js - Cloudflare Pages R2 Image CDN Proxy
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1)); // Remove leading '/'

    // Health check or root path
    if (!key) {
      return new Response("⚡ R2 Media Relay is running.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Bind your R2 bucket as 'MY_BUCKET' in Pages settings
    const bucket = env.MY_BUCKET;
    if (!bucket) {
      return new Response("Configuration Error: MY_BUCKET binding not found.", { status: 500 });
    }

    // Fetch object from R2
    const object = await bucket.get(key);
    if (!object) {
      return new Response("404 Not Found: File does not exist.", {
        status: 404,
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    // Determine Content-Type based on extension
    const ext = key.split(".").pop().toLowerCase();
    const mimeTypes = {
      webp: "image/webp",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      avif: "image/avif",
      jxl: "image/jxl",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      json: "application/json",
      zip: "application/zip",
    };
    const contentType = object.httpMetadata?.contentType || mimeTypes[ext] || "application/octet-stream";

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", contentType);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    // Cache heavily at Cloudflare Edge and in browsers
    headers.set("Cache-Control", "public, max-age=2592000, immutable");
    headers.set("Cloudflare-CDN-Cache-Control", "public, max-age=2592000, immutable");

    // Handle Range Requests (essential for video playback like MP4/WebM)
    const range = request.headers.get("Range");
    if (range && object.range) {
      headers.set("Accept-Ranges", "bytes");
    }

    return new Response(object.body, {
      status: 200,
      headers,
    });
  },
};
```

---

### Step 2: Deploy to Cloudflare Pages (One Command)

Open your terminal in that folder and run:

```bash
npx wrangler pages deploy . --project-name=my-media-bin
```
*(Replace `my-media-bin` with any unique name you like. If prompted, log into your Cloudflare account).*

Once finished, Wrangler will print your new public URL:  
👉 `https://my-media-bin.pages.dev`

---

### Step 3: Bind your R2 Bucket

Now tell Cloudflare Pages which R2 bucket to read from:

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Compute (Workers & Pages)** -> Select your Pages project (`my-media-bin`).
2. Go to **Settings** -> **Functions** -> Scroll down to **R2 bucket bindings**.
3. Click **Add binding**:
   - **Variable name**: `MY_BUCKET` *(Must match the variable name in `_worker.js`)*
   - **R2 bucket**: Select your image bucket.
4. Click **Save**.
5. *(Optional)* Go to the **Deployments** tab, click the `...` menu on your latest deployment, and click **Retry deployment** to apply the binding immediately.

---

### Step 4: That's It! Test Your New CDN 🚀

Upload any file (e.g. `test.webp`) to your R2 bucket.  
You can now access it anywhere in the world at:

```text
https://my-media-bin.pages.dev/test.webp
```

- Direct image preview in any browser ✅
- Direct embedding in Discord / Reddit / Civitai ✅
- No domain subscription fees forever ✅

---

## ❓ FAQ & Resource Limits

### Does this burn through my Workers daily quota?
- **No, edge caching protects your quota**: The first request to a new image runs `_worker.js` (consuming 1 of your 100,000 free daily requests). Once cached at Cloudflare's edge data centers, subsequent requests are served directly from the CDN cache without invoking the Worker script.
- **Bandwidth**: 100% Free. R2 has **$0 egress fees**, even if millions of people view your images.

### Can I connect multiple Pages URLs to one bucket?
Yes! You can deploy multiple Pages projects (e.g. `blob-bin.pages.dev`, `content-relay.pages.dev`) pointing to the same R2 bucket or different buckets.

---

## 🤝 Integration with BYOC / BYORR Converter

In [BYOC Converter](https://byoc-converter.pages.dev) or [BYORR Converter](https://byorr-converter.pages.dev):
1. Expand the Cloudflare Settings section.
2. Add your `https://my-media-bin.pages.dev` URL in the **Public Direct Domain** settings.
3. Every uploaded image or video will now automatically generate direct, permanent, copy-pasteable links powered by your free Pages CDN!
