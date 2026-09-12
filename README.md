# Cividge 🚀

> **A Local-First, Zero-Egress Media Converter & Decentralized Cloud Storage Manager**  
> Convert images in-browser via WebAssembly, and upload directly to Cloudflare R2 & IPFS (Filebase) via S3 API with zero server costs, robust edge caching, and rich social media previews.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Architecture: Local--First](https://img.shields.io/badge/Architecture-Local--First-green.svg)
![Storage: R2%20%2B%20IPFS](https://img.shields.io/badge/Storage-R2%20%2B%20IPFS-orange.svg)
![Edge: Cloudflare%20Pages](https://img.shields.io/badge/Edge-Cloudflare%20Pages-F38020.svg)

---

## 🌟 Live Demo

- **Main App**: [https://cividge.pages.dev](https://cividge.pages.dev)
- **Edge Cache Endpoints**:
  - https://content-cache.pages.dev
  - https://misskey-media.pages.dev
  - https://blobs-cache.pages.dev

---

## 📖 Overview

**Cividge** is a privacy-first web application and edge delivery engine designed for creators, digital artists, and Fediverse/Misskey users. It allows you to:

1. **Optimize and convert images locally** (WebP, JXL, JPEG) in your browser without ever sending uncompressed images to a middleman server.
2. **Upload directly to your own storage** (Cloudflare R2 or Filebase IPFS) using standard S3 API credentials stored only in your browser (localStorage).
3. **Deliver media across social platforms (Misskey, Twitter/X, Discord)** with instant OGP cards, video/audio range-streaming, and 3-tier Cloudflare CDN edge caching.

### 🔒 100% Zero-Knowledge & Private
Your Cloudflare R2 & Filebase access keys never leave your machine. Uploads happen straight from your browser to storage endpoints via pre-signed S3 commands.

---

## ✨ Key Features

### 🎨 In-Browser Image Engine (WASM)
- High-efficiency conversion to **WebP**, **JPEG XL (JXL)**, and **JPEG** using @jsquash WebAssembly modules.
- Strips location/Exif metadata automatically on Canvas conversion to preserve personal privacy.
- ComfyUI & Stable Diffusion prompt / workflow preservation & inspection tools.

### ⚡ Zero-Cost Decentralized Delivery (Pages Functions)
- **3-Tier Edge Caching**: 1 hour for images/docs, 4 hours for video/audio, and 7-day keep-alive caching for drifting/unpinned IPFS files.
- **Instant Social OGP HTML**: Misskey (SummalyBot), Discord, and Twitter crawlers receive lightweight OGP HTML and first-frame video thumbnails (.thumb.webp), completely avoiding 10MB payload drop-offs and preview timeouts.
- **Audio & Video Streaming**: Full support for HTTP 206 Partial Content (byte-range requests) for seeking in mp4, webm, mov, mp3, wav, m4a, and lac.
- **Domain Switcher**: Switch and copy links across registered custom domains and Pages edges (misskey-media.pages.dev, content-cache.pages.dev, etc.) with one click.

### 🪐 Dual Storage Backend: R2 + IPFS
- **Cloudflare R2**: High-speed, zero-egress fee object storage.
- **Filebase (IPFS)**: Decentralized immutable pinning with automatic FIFO capacity rotation and local Kubo IPFS node pin integration.

### 🛡️ File Security & Safety
- **Password Gate**: Protect individual files with a pass-phrase; Cloudflare Functions verify sessions via SHA-256 hash without origin server requirements.
- **Strict Whitelist**: Blocks malicious scripts and executables (xe, at, html, svg, archives) to protect origin domains and maintain clean hosting compliance.

### 📱 Cross-Device Sync & Helper Tools
- **Optical QR Code Transfer**: Transfer your watched Civitai creators, custom domains, and connection settings to mobile devices in seconds.
- **URL Palette**: Built-in copy helpers and formatters for social media posts, forums, and markdown links.
- **Multilingual (i18n)**: English and Japanese UI support.

---

## ⚙️ Storage Setup (CORS Configuration)

### Cloudflare R2 CORS Policy
Add the following CORS policy in **Cloudflare Dashboard ➜ R2 ➜ Bucket ➜ Settings ➜ CORS Policy**:

`json
[
  {
    "AllowedOrigins": [
      "https://cividge.pages.dev",
      "https://okpn.github.io",
      "http://localhost:5173"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
`

### Filebase CORS Policy
Click the **⚙️ CORS自動設定** button inside the Cividge settings panel, or set the following policy on Filebase:

`json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-cid",
      "x-amz-meta-ipfs-hash",
      "x-amz-meta-size"
    ],
    "MaxAgeSeconds": 3600
  }
]
`

---

## 🛠️ Local Development & Build

`ash
# Clone the repository
git clone https://github.com/OKPN/cividge.git
cd cividge

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
`

Deploy static build and Functions to Cloudflare Pages:

`ash
npx wrangler pages deploy dist --project-name cividge --branch main
`

---

## 🔗 Related Repositories

- [cividge-kv-worker](https://github.com/OKPN/cividge-kv-worker): Edge routing, metadata registry, and CDN cache management worker.

---

## 📄 License

MIT License © 2026 OKPN
