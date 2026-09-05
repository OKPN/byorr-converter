# BYORR Converter 🚀

> **Bring Your Own R2 Converter**  
> A local-first, privacy-focused in-browser image converter & direct Cloudflare R2 storage manager via S3 API. No backend server or Cloudflare Worker required!

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Architecture: Local--First](https://img.shields.io/badge/Architecture-Local--First-green.svg)
![Stack: S3--API--SDK](https://img.shields.io/badge/Stack-S3--API-orange.svg)
[![Zero-Dollar CDN Guide](https://img.shields.io/badge/Guide-Free%20R2%20CDN-brightgreen?style=for-the-badge)](docs/FREE_R2_PAGES_CDN_GUIDE.md)

---

## 🌟 Live Demo

👉 **[https://byorr-converter.pages.dev](https://byorr-converter.pages.dev)**

---

## 🚀 Free R2 Media CDN (No Custom Domain Required)

Need a free, public direct URL for your R2 bucket without buying a custom domain?  
Follow our zero-dollar recipe using Cloudflare Pages & `_worker.js`:

👉 **[📖 Zero-Dollar R2 Image CDN via Cloudflare Pages Guide](docs/FREE_R2_PAGES_CDN_GUIDE.md)**

---

## 📖 Overview

**BYORR Converter** is a high-performance, client-side web application designed to convert, optimize, upload, and manage images directly within your browser. 

By leveraging **WebAssembly (WASM)** for image encoding and the official **AWS S3 SDK (`@aws-sdk/client-s3`)**, BYORR Converter connects straight to your Cloudflare R2 bucket without routing data through any third-party servers or Cloudflare Workers.

### 🔒 100% Zero-Knowledge & Private
Your Cloudflare credentials (Account ID, Access Key ID, Secret Access Key) are stored **exclusively in your browser's local storage (`localStorage`)**. They are never transmitted to any external server or telemetry endpoint.

---

## ✨ Key Features

- ⚡ **Zero Backend / Serverless**  
  Communicates directly with Cloudflare R2 via S3 API (`PutObjectCommand`, `ListObjectsV2Command`, `DeleteObjectCommand`, `CopyObjectCommand`). Zero hosting costs for backend infrastructure.
- 🎨 **In-Browser Multi-Format Conversion**  
  Converts images to **WebP**, **JPEG**, **PNG**, and next-generation **JPEG XL (JXL)** using WebAssembly.
- 🛡️ **Foolproof 2-Step UX**  
  Unlocks S3 API key input fields only after a Public Domain or R2 Dev URL is specified, preventing dead links and missing thumbnail issues.
- 📂 **Full-Featured Storage Management**  
  - ✏️ **Inline Object Renaming**: Rename uploaded files directly in the UI.
  - 📌 **Persistence Protection (`keep/`)**: Lock critical files to prevent accidental or automated deletion.
  - 🧹 **Automated 7-Day Cleanup**: Automatically purge unprotected files older than 7 days upon page access (optional).
  - 📊 **Storage Quota Visualizer**: Real-time storage usage bar and batch deletion support.
- 💬 **Posting & Sharing Helper**  
  Built-in text composer palette with template support for forums (5ch, Reddit) and social media.
- 📱 **Optical QR Code Sync**  
  Effortlessly transfer connection configurations to smartphones or other devices via camera QR scanning.
- 🌐 **Multilingual (i18n)**  
  Full support for English and Japanese interfaces.

---

## ⚙️ Cloudflare R2 Bucket Setup (CORS Configuration)

To allow your browser to communicate directly with your Cloudflare R2 bucket via S3 API, configure your bucket's **CORS (Cross-Origin Resource Sharing)** policy in the Cloudflare Dashboard:

1. Go to **Cloudflare Dashboard** -> **R2** -> Select your Bucket -> **Settings**.
2. Scroll to **CORS Policy** and click **Edit CORS Policy**.
3. Paste the following JSON policy:

```json
[
  {
    "AllowedOrigins": [
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
```

---

## 🛠️ Usage Guide

1. Open **[BYORR Converter](https://byorr-converter.pages.dev)**.
2. Expand **☁️ Cloudflare R2 Connection (S3 API)**.
3. **Step 1**: Enter either your **Direct Public Domain URL** (e.g., `https://my-media-bin.pages.dev` or `https://my-domain.com`) or **R2 Dev Address** (e.g., `https://pub-xxx.r2.dev`). This unlocks Step 2.
4. **Step 2**: Enter your **Account ID**, **R2 Bucket Name**, **Access Key ID**, and **Secret Access Key**. *(Note: Pasting the full Cloudflare S3 API URL automatically extracts your Account ID)*.
5. Click **Save** (credentials are saved locally).
6. Drag & drop images, convert, and upload directly to R2!

---

## 🔗 Sister Project

Looking for a Cloudflare Worker KV-based solution?  
Check out **[BYOC Converter](https://byoc-converter.pages.dev)** for Worker & KV workflow integration.

---

## 📄 License

Distributed under the **MIT License**.  
Created with ❤️ by **OKPN**.
