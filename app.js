import QRCode from "qrcode";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

// --- 多言語 (i18n) 辞書 ---
const i18nDict = {
  ja: {
    siteTitle: "BYORR Converter",
    eyebrow: "ブラウザ内のみで画像をセキュアに変換 ＆ R2にダイレクト保存!",
    whatIsSiteSummary: "❓ どのようなサイト？",
    whatIsSiteBody: "外部サーバやWorkerを一切介さず、お使いのブラウザ内だけで画像をセキュアに変換し、ご自身の Cloudflare R2 ストレージ（S3互換）にダイレクト保存・配信できるローカル＆R2専用ツールです。<br><span style=\"display: inline-block; margin-top: 6px; font-size: 12px; color: #a5b4fc;\">※接続情報は全てお使いのブラウザ内（localStorage）にのみセキュア保存されます。</span>",
    inputFiles: "入力ファイル",
    addFolder: "フォルダを追加",
    dropText: "画像やフォルダをここにドロップ",
    orClick: "またはクリックしてファイルを選択",
    settings: "設定",
    outputFormat: "出力形式",
    quality: "品質",
    renameRule: "リネーム規則",
    originalName: "元ファイル名",
    seq01: "連番 (01)",
    seq001: "連番 (001)",
    random6: "ランダム (6文字)",
    retentionPeriod: "保存期間",
    cfTitle: "☁️ Cloudflare R2 接続設定 (S3 API)",
    r2AccountLabel: "Account ID",
    r2AccountSub: "Cloudflare アカウント ID",
    r2BucketLabel: "R2 バケット名",
    r2BucketSub: "対象の Cloudflare R2 バケット名",
    r2AccessKeyLabel: "Access Key ID",
    r2AccessKeySub: "R2 API トークンの Access Key ID",
    r2SecretKeyLabel: "Secret Access Key",
    r2SecretKeySub: "R2 API トークンの Secret Access Key",
    r2DomainLabel: "直リンク公開ドメイン URL",
    r2DomainSub: "カスタムドメイン（コピーボタンで使用）",
    r2DevDomainLabel: "R2 Dev アドレス (dev URL)",
    r2DevDomainSub: "R2 パブリック dev アドレス（devコピーで使用）",
    btnSave: "保存する",
    btnShareQr: "📱 スマホへ共有",
    btnClear: "クリア",
    r2Notice: "ブラウザから Cloudflare R2 ストレージへダイレクトに通信します（バックエンド Worker 不要）。事前に R2 バケットの設定で CORS（Cross-Origin Resource Sharing）を許可してください。",
    btnConvertUpload: "変換してアップロード",
    btnUploadRename: "リネームだけしてアップロード",
    btnUploadOriginal: "そのままアップロード",
    btnConvertOnly: "変換だけする",
    btnConvertDownload: "変換してダウンロード",
    outputFiles: "出力ファイル",
    statusWaiting: "待機中",
    statusReady: "準備完了",
    btnZipDownload: "ZIPで一括ダウンロード",
    btnUploadAll: "すべてアップロード",
    textComposerHeading: "💬 テキスト作成支援",
    r2Heading: "⚡ Cloudflare R2 ストレージ内のファイル",
    usagePrefix: "使用量",
    limitPrefix: "上限",
    btnReload: "更新",
    btnBatchDelete: "選択削除",
    copyUrl: "コピー",
    devCopyUrl: "devコピー",
    deleteNow: "削除",
    copied: "コピー完了!",
    failed: "失敗",
    noFilesR2: "ファイルはありません。",
    selectFileR2: "削除するファイルを選択してください。",
    confirmBatchDelete: "選択した {count} 件のファイルを R2 ストレージから削除しますか？",
    confirmSingleDelete: "ファイル '{key}' を R2 ストレージから削除しますか？",
    deleteSuccess: "削除が完了しました。",
    saveSuccess: "R2 接続情報を保存しました！",
    clearSuccess: "接続情報をクリアしました。",
    missingConfig: "R2 接続情報 (Account ID, バケット名, Access Key, Secret Key) を設定してください。",
    s3Error: "R2 ストレージ通信エラー",
    rateReduced: "{rate}% 削減",
    rateIncreased: "{rate}% 増加",
    rateUnchanged: "0% 変化なし",
    nonConverted: "非変換",
  },
  en: {
    siteTitle: "BYORR Converter",
    eyebrow: "Secure in-browser image conversion & direct Cloudflare R2 upload!",
    whatIsSiteSummary: "❓ What is this site?",
    whatIsSiteBody: "A local-first tool that converts images entirely within your browser and uploads directly to your Cloudflare R2 storage via S3 API without any server/worker.<br><span style=\"display: inline-block; margin-top: 6px; font-size: 12px; color: #a5b4fc;\">※ Connection details are stored safely in your browser (localStorage) only.</span>",
    inputFiles: "Input Files",
    addFolder: "Add Folder",
    dropText: "Drop images or folders here",
    orClick: "or click to select files",
    settings: "Settings",
    outputFormat: "Output Format",
    quality: "Quality",
    renameRule: "Rename Pattern",
    originalName: "Original Name",
    seq01: "Sequence (01)",
    seq001: "Sequence (001)",
    random6: "Random (6 chars)",
    retentionPeriod: "Retention Period",
    cfTitle: "☁️ Cloudflare R2 Connection (S3 API)",
    r2AccountLabel: "Account ID",
    r2AccountSub: "Cloudflare Account ID",
    r2BucketLabel: "R2 Bucket Name",
    r2BucketSub: "Target Cloudflare R2 Bucket Name",
    r2AccessKeyLabel: "Access Key ID",
    r2AccessKeySub: "R2 API Token Access Key ID",
    r2SecretKeyLabel: "Secret Access Key",
    r2SecretKeySub: "R2 API Token Secret Access Key",
    r2DomainLabel: "Direct Public Domain URL",
    r2DomainSub: "Custom domain (used by Copy button)",
    r2DevDomainLabel: "R2 Dev Address (dev URL)",
    r2DevDomainSub: "R2 public dev address (used by devCopy button)",
    btnSave: "Save",
    btnShareQr: "📱 Share via QR",
    btnClear: "Clear",
    r2Notice: "Communicates directly with Cloudflare R2 via S3 API (no worker needed). Please allow CORS on your R2 bucket settings.",
    btnConvertUpload: "Convert & Upload",
    btnUploadRename: "Rename & Upload",
    btnUploadOriginal: "Upload As-Is",
    btnConvertOnly: "Convert Only",
    btnConvertDownload: "Convert & Download",
    outputFiles: "Output Files",
    statusWaiting: "Waiting",
    statusReady: "Ready",
    btnZipDownload: "Download ZIP",
    btnUploadAll: "Upload All",
    textComposerHeading: "💬 Text Composer",
    r2Heading: "⚡ Files in Cloudflare R2 Storage",
    usagePrefix: "Usage",
    limitPrefix: "Limit",
    btnReload: "Reload",
    btnBatchDelete: "Delete Selected",
    copyUrl: "Copy",
    devCopyUrl: "devCopy",
    deleteNow: "Delete",
    copied: "Copied!",
    failed: "Failed",
    noFilesR2: "No files in storage.",
    selectFileR2: "Please select files to delete.",
    confirmBatchDelete: "Are you sure you want to delete {count} selected files from R2?",
    confirmSingleDelete: "Delete file '{key}' from R2 storage?",
    deleteSuccess: "Deletion completed.",
    saveSuccess: "R2 connection settings saved!",
    clearSuccess: "Connection settings cleared.",
    missingConfig: "Please configure R2 Account ID, Bucket Name, Access Key, and Secret Key.",
    s3Error: "R2 storage communication error",
    rateReduced: "{rate}% reduced",
    rateIncreased: "{rate}% increased",
    rateUnchanged: "0% unchanged",
    nonConverted: "Original",
  }
};

// --- アプリケーション状態 ---
const state = {
  files: [],
  results: [],
  r2TotalSize: 0,
};

// --- DOM 要素 ---
const fileInput = document.querySelector("#fileInput");
const folderInput = document.querySelector("#folderInput");
const folderSelectButton = document.querySelector("#folderSelectButton");
const dropzone = document.querySelector("#dropzone");
const fileList = document.querySelector("#fileList");
const resultList = document.querySelector("#resultList");
const fileCount = document.querySelector("#fileCount");
const statusText = document.querySelector("#statusText");

// ☁️ Cloudflare R2 接続設定フォーム要素
const r2AccountId = document.querySelector("#r2AccountId");
const r2BucketName = document.querySelector("#r2BucketName");
const r2AccessKeyId = document.querySelector("#r2AccessKeyId");
const r2SecretAccessKey = document.querySelector("#r2SecretAccessKey");
const r2PublicDomain = document.querySelector("#r2PublicDomain");
const r2DevDomain = document.querySelector("#r2DevDomain");

const cfStatus = document.querySelector("#cfStatus");
const cfSettingsAccordion = document.querySelector("#cfSettingsAccordion");
const cfSaveButton = document.querySelector("#cfSaveButton");
const cfClearButton = document.querySelector("#cfClearButton");
const cfShareQrButton = document.querySelector("#cfShareQrButton");

// QRコードモーダル要素
const qrModal = document.querySelector("#qrModal");
const qrCanvas = document.querySelector("#qrCanvas");
const closeQrModalButton = document.querySelector("#closeQrModalButton");

// 言語切替
const langSelect = document.querySelector("#langSelect");

function getAppLanguage() {
  const saved = localStorage.getItem("appLang");
  if (saved && (saved === "ja" || saved === "en")) return saved;
  return navigator.language.startsWith("ja") ? "ja" : "en";
}

function setAppLanguage(lang) {
  localStorage.setItem("appLang", lang);
  applyLanguage(lang);
}

function applyLanguage(lang) {
  const dict = i18nDict[lang] || i18nDict.ja;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      if (el.hasAttribute("data-i18n-html")) {
        el.innerHTML = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  if (langSelect) langSelect.value = lang;
  render();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// S3 クライアントのオンデマンド取得
function getS3Client() {
  const accountId = r2AccountId.value.trim();
  const accessKey = r2AccessKeyId.value.trim();
  const secretKey = r2SecretAccessKey.value.trim();

  if (!accountId || !accessKey || !secretKey) {
    return null;
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
}

function getR2PublicBaseUrl() {
  const custom = r2PublicDomain.value.trim();
  if (custom) return custom.replace(/\/$/, "");
  
  const bucket = r2BucketName.value.trim();
  const accountId = r2AccountId.value.trim();
  if (bucket && accountId) {
    return `https://${bucket}.${accountId}.r2.cloudflarestorage.com`;
  }
  return "";
}

function getR2DevBaseUrl() {
  const dev = r2DevDomain?.value?.trim();
  if (dev) return dev.replace(/\/$/, "");
  return getR2PublicBaseUrl();
}

function isR2Configured() {
  const accountId = r2AccountId.value.trim();
  const bucket = r2BucketName.value.trim();
  const accessKey = r2AccessKeyId.value.trim();
  const secretKey = r2SecretAccessKey.value.trim();
  return Boolean(accountId && bucket && accessKey && secretKey);
}

function updateCfStatus() {
  const isOk = isR2Configured();
  if (cfStatus) {
    if (isOk) {
      cfStatus.style.color = "var(--good)";
      cfStatus.textContent = "✅ R2 接続設定がローカルに自動保存されています";
    } else {
      cfStatus.style.color = "var(--muted)";
      cfStatus.textContent = "⚠️ Account ID, バケット名, Access Key, Secret Key をすべて入力すると自動保存されます";
    }
  }
  return isOk;
}

// 接続設定の自動保存・ボタン状態更新
function saveCfSettingsAuto() {
  const accountId = r2AccountId.value.trim();
  const bucket = r2BucketName.value.trim();
  const accessKey = r2AccessKeyId.value.trim();
  const secretKey = r2SecretAccessKey.value.trim();
  const domain = r2PublicDomain.value.trim();
  const devDomain = r2DevDomain?.value?.trim() || "";

  if (accountId) localStorage.setItem("r2AccountId", accountId);
  else localStorage.removeItem("r2AccountId");

  if (bucket) localStorage.setItem("r2BucketName", bucket);
  else localStorage.removeItem("r2BucketName");

  if (accessKey) localStorage.setItem("r2AccessKeyId", accessKey);
  else localStorage.removeItem("r2AccessKeyId");

  if (secretKey) localStorage.setItem("r2SecretAccessKey", secretKey);
  else localStorage.removeItem("r2SecretAccessKey");

  if (domain) localStorage.setItem("r2PublicDomain", domain);
  else localStorage.removeItem("r2PublicDomain");

  if (devDomain) localStorage.setItem("r2DevDomain", devDomain);
  else localStorage.removeItem("r2DevDomain");

  updateCfStatus();
  render();
}

// 接続設定の保存・読み込み
function saveCfSettings() {
  const accountId = r2AccountId.value.trim();
  const bucket = r2BucketName.value.trim();
  const accessKey = r2AccessKeyId.value.trim();
  const secretKey = r2SecretAccessKey.value.trim();
  const domain = r2PublicDomain.value.trim();
  const devDomain = r2DevDomain?.value?.trim() || "";

  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!accountId || !bucket || !accessKey || !secretKey) {
    cfStatus.style.color = "var(--danger)";
    cfStatus.textContent = dict.missingConfig;
    return;
  }

  localStorage.setItem("r2AccountId", accountId);
  localStorage.setItem("r2BucketName", bucket);
  localStorage.setItem("r2AccessKeyId", accessKey);
  localStorage.setItem("r2SecretAccessKey", secretKey);
  localStorage.setItem("r2PublicDomain", domain);
  localStorage.setItem("r2DevDomain", devDomain);

  cfStatus.style.color = "var(--good)";
  cfStatus.textContent = dict.saveSuccess;
  render();
  fetchAndRenderR2Files();
}

function clearCfSettings() {
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  localStorage.removeItem("r2AccountId");
  localStorage.removeItem("r2BucketName");
  localStorage.removeItem("r2AccessKeyId");
  localStorage.removeItem("r2SecretAccessKey");
  localStorage.removeItem("r2PublicDomain");
  localStorage.removeItem("r2DevDomain");

  r2AccountId.value = "";
  r2BucketName.value = "";
  r2AccessKeyId.value = "";
  r2SecretAccessKey.value = "";
  r2PublicDomain.value = "";
  if (r2DevDomain) r2DevDomain.value = "";

  cfStatus.style.color = "var(--muted)";
  cfStatus.textContent = dict.clearSuccess;
  render();
  fetchAndRenderR2Files();
}

function loadSettings() {
  r2AccountId.value = localStorage.getItem("r2AccountId") || "";
  r2BucketName.value = localStorage.getItem("r2BucketName") || "";
  r2AccessKeyId.value = localStorage.getItem("r2AccessKeyId") || "";
  r2SecretAccessKey.value = localStorage.getItem("r2SecretAccessKey") || "";
  r2PublicDomain.value = localStorage.getItem("r2PublicDomain") || "";
  if (r2DevDomain) r2DevDomain.value = localStorage.getItem("r2DevDomain") || "";

  const savedFormat = localStorage.getItem("formatSelect");
  if (savedFormat && extensions[savedFormat]) {
    formatSelect.value = savedFormat;
  }

  const savedQuality = localStorage.getItem("qualityRange");
  if (savedQuality) {
    qualityRange.value = savedQuality;
    qualityOutput.textContent = savedQuality;
  }

  const savedRename = localStorage.getItem("renamePattern");
  if (savedRename) {
    renamePattern.value = savedRename;
  }

  const savedLimit = localStorage.getItem("storageLimit") || "10000";
  storageLimitRange.value = savedLimit;
  updateLimitOutput(savedLimit);

  if (autoCleanupCheckbox) {
    autoCleanupCheckbox.checked = localStorage.getItem("autoCleanup7Days") === "true";
  }

  loadTemplates();
  updateCfStatus();
  applyLanguage(getAppLanguage());
}

// QRコードによる設定共有
function shareConnectionQr() {
  const config = {
    a: r2AccountId.value.trim(),
    b: r2BucketName.value.trim(),
    k: r2AccessKeyId.value.trim(),
    s: r2SecretAccessKey.value.trim(),
    d: r2PublicDomain.value.trim(),
    dev: r2DevDomain?.value?.trim() || "",
  };

  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!config.a || !config.b || !config.k || !config.s) {
    alert(dict.missingConfig);
    return;
  }

  const jsonStr = JSON.stringify(config);
  const currentUrl = new URL(window.location.href);
  currentUrl.hash = `#cfg=${encodeURIComponent(jsonStr)}`;

  QRCode.toCanvas(qrCanvas, currentUrl.href, { width: 260, margin: 2 }, err => {
    if (err) console.error("QR Code Error:", err);
    else qrModal.style.display = "flex";
  });
}

function parseUrlConfigHash() {
  if (!window.location.hash.startsWith("#cfg=")) return;
  try {
    const raw = window.location.hash.replace("#cfg=", "");
    const config = JSON.parse(decodeURIComponent(raw));
    if (config.a) r2AccountId.value = config.a;
    if (config.b) r2BucketName.value = config.b;
    if (config.k) r2AccessKeyId.value = config.k;
    if (config.s) r2SecretAccessKey.value = config.s;
    if (config.d) r2PublicDomain.value = config.d;
    if (config.dev && r2DevDomain) r2DevDomain.value = config.dev;
    saveCfSettings();
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  } catch (e) {
    console.error("Parse config hash error:", e);
  }
}

// Web Worker (画像変換)
const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });

const formatSelect = document.querySelector("#formatSelect");
const qualityRange = document.querySelector("#qualityRange");
const qualityOutput = document.querySelector("#qualityOutput");
const renamePattern = document.querySelector("#renamePattern");
const clearRenamePattern = document.querySelector("#clearRenamePattern");
const storageLimitRange = document.querySelector("#storageLimitRange");
const storageLimitOutput = document.querySelector("#storageLimitOutput");

const convertButton = document.querySelector("#convertButton");
const convertDownloadButton = document.querySelector("#convertDownloadButton");
const convertUploadButton = document.querySelector("#convertUploadButton");
const uploadRenameButton = document.querySelector("#uploadRenameButton");
const uploadOriginalButton = document.querySelector("#uploadOriginalButton");

const zipButton = document.querySelector("#zipButton");
const uploadAllButton = document.querySelector("#uploadAllButton");
const clearButton = document.querySelector("#clearButton");
const progressBar = document.querySelector("#progressBar");

// R2 ストレージ一覧 DOM
const reloadR2FilesButton = document.querySelector("#reloadR2FilesButton");
const deleteSelectedR2FilesButton = document.querySelector("#deleteSelectedR2FilesButton");
const autoCleanupCheckbox = document.querySelector("#autoCleanupCheckbox");
const r2FileList = document.querySelector("#r2FileList");

const extensions = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/jxl": "jxl",
  "image/png": "png",
};

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function updateStatus(text) {
  if (statusText) statusText.textContent = text;
}

function updateProgress(value) {
  if (progressBar) progressBar.value = value;
}

function updateLimitOutput(value) {
  const mb = Number(value);
  if (mb >= 1000) {
    storageLimitOutput.textContent = `1.0 GB`;
  } else {
    storageLimitOutput.textContent = `${(mb / 1000).toFixed(1)} GB`;
  }
}

function generateFilename(pattern, file, index, extension) {
  const extIndex = file.name.lastIndexOf(".");
  const nameWithoutExt = extIndex !== -1 ? file.name.slice(0, extIndex) : file.name;
  let filename = pattern.replace(/\{name\}/g, nameWithoutExt);
  filename = filename.replace(/\{num:(\d+)\}/g, (_, width) => String(index + 1).padStart(Number(width), "0"));
  filename = filename.replace(/\{randam:(\d+)\}/g, (_, len) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let res = "";
    for (let i = 0; i < Number(len); i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  });
  return `${filename}.${extension}`;
}

function addFiles(fileListToAdd) {
  const validFiles = Array.from(fileListToAdd).filter(f => f.type.startsWith("image/") || f.type.startsWith("audio/") || f.type.startsWith("video/"));
  state.files.push(...validFiles);
  render();
}

function render() {
  const r2Ok = isR2Configured();
  const hasFiles = state.files.length > 0;
  if (fileCount) fileCount.textContent = `${state.files.length}件`;

  if (convertButton) convertButton.disabled = !hasFiles;
  if (convertDownloadButton) convertDownloadButton.disabled = !hasFiles;
  if (convertUploadButton) convertUploadButton.disabled = !hasFiles || !r2Ok;
  if (uploadOriginalButton) uploadOriginalButton.disabled = !hasFiles || !r2Ok;
  if (uploadRenameButton) uploadRenameButton.disabled = !hasFiles || !r2Ok;

  const hasResults = state.results.length > 0;
  if (zipButton) zipButton.disabled = !hasResults;
  if (uploadAllButton) uploadAllButton.disabled = !hasResults || !r2Ok;

  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (statusText) {
    statusText.textContent = hasFiles ? dict.statusReady : dict.statusWaiting;
  }

  if (fileList) {
    fileList.innerHTML = "";
    state.files.forEach((file, index) => {
      const item = document.createElement("article");
      item.className = "file-item";

      let thumbHtml = "";
      const ext = file.name.split(".").pop().toLowerCase();
      const isVideo = file.type.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext);

      if (file.type.startsWith("image/")) {
        thumbHtml = `<img class="thumb" alt="" src="${URL.createObjectURL(file)}">`;
      } else if (isVideo) {
        thumbHtml = `<video class="thumb" src="${URL.createObjectURL(file)}#t=0.5" preload="metadata" muted playsinline style="object-fit: cover; pointer-events: none;"></video>`;
      } else {
        thumbHtml = `<div class="thumb format-badge">${escapeHtml(ext.toUpperCase())}</div>`;
      }

      item.innerHTML = `
        ${thumbHtml}
        <div>
          <div class="item-name">${escapeHtml(file.name)}</div>
          <div class="item-meta">${formatSize(file.size)} · ${escapeHtml(file.type || "不明")}</div>
        </div>
        <button type="button" class="ghost-button delete-button danger-button" data-index="${index}" aria-label="削除">&times;</button>
      `;
      fileList.appendChild(item);
    });
  }

  renderResults();
}

function renderResults() {
  if (!resultList) return;
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  resultList.innerHTML = "";
  if (!state.results.length) {
    const empty = document.createElement("div");
    empty.className = "item-meta";
    empty.style.padding = "18px 0";
    empty.textContent = "変換後のファイルがここに表示されます。";
    resultList.appendChild(empty);
    return;
  }

  state.results.forEach((result, idx) => {
    if (!result) return;
    const item = document.createElement("article");
    item.className = "result-item";

    const saved = (result.originalSize || result.size) - result.size;
    const savedRate = result.originalSize ? Math.round((saved / result.originalSize) * 100) : 0;

    let thumbHtml = "";
    const ext = result.filename.split(".").pop().toLowerCase();
    const isVideo = ["mp4", "webm", "mov"].includes(ext);

    if (result.type && result.type.startsWith("image/")) {
      thumbHtml = `<img class="thumb" alt="" src="${result.url}">`;
    } else if (isVideo) {
      thumbHtml = `<video class="thumb" src="${result.url}#t=0.5" preload="metadata" muted playsinline style="object-fit: cover; pointer-events: none;"></video>`;
    } else {
      thumbHtml = `<div class="thumb format-badge">${escapeHtml(ext.toUpperCase())}</div>`;
    }

    let metaHtml = "";
    if (result.isNonImage) {
      metaHtml = `${formatSize(result.size)} · ${escapeHtml(dict.nonConverted)}`;
    } else {
      let rateText = "";
      if (savedRate > 0) {
        rateText = `<span style="color: #4caf50; font-weight: bold;">${savedRate}% 削減</span>`;
      } else if (savedRate < 0) {
        rateText = `<span style="color: #ff5252; font-weight: bold;">${Math.abs(savedRate)}% 増加</span>`;
      } else {
        rateText = `<span style="color: var(--muted);">0% 変化なし</span>`;
      }
      metaHtml = `${formatSize(result.originalSize || result.size)} -> ${formatSize(result.size)} · ${rateText}`;
    }

    item.innerHTML = `
      <a href="${escapeHtml(result.uploadedUrl || result.url)}" target="_blank" rel="noopener noreferrer" class="thumb-link" title="画像を表示">
        ${thumbHtml}
      </a>
      <div>
        <div class="result-name">${escapeHtml(result.filename)}</div>
        <div class="result-meta">${metaHtml}</div>
        ${result.uploadedUrl ? `<a href="${escapeHtml(result.uploadedUrl)}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: var(--accent); text-decoration: none; word-break: break-all;">${escapeHtml(result.uploadedUrl)}</a>` : ""}
      </div>
      <div class="result-actions">
        ${isR2Configured() ? `<button type="button" class="ghost-button upload-single-btn" data-index="${idx}">${result.uploadedUrl ? "再アップロード" : "アップロード"}</button>` : ""}
        <button type="button" class="primary-button download-single-btn" data-index="${idx}">ダウンロード</button>
      </div>
    `;
    resultList.appendChild(item);
  });
}

// 画像変換処理
async function processImages(autoDownload = false, autoUpload = false) {
  if (!state.files.length) return;
  state.results = [];
  renderResults();
  updateProgress(0);

  const targetFormat = formatSelect.value;
  const quality = Number(qualityRange.value);
  const pattern = renamePattern.value.trim() || "{name}";
  const extension = extensions[targetFormat] || "jpg";

  updateStatus(`0 / ${state.files.length} 処理中...`);

  for (let i = 0; i < state.files.length; i++) {
    const file = state.files[i];
    const newFilename = generateFilename(pattern, file, i, extension);

    try {
      let resultBlob;
      if (file.type.startsWith("image/")) {
        const convertedBuffer = await new Promise((resolve, reject) => {
          const handler = e => {
            if (e.data.type === "SUCCESS" || e.data.ok) {
              worker.removeEventListener("message", handler);
              resolve(e.data.buffer);
            } else if (e.data.type === "ERROR" || e.data.ok === false) {
              worker.removeEventListener("message", handler);
              reject(new Error(e.data.error || "画像変換エラー"));
            }
          };
          worker.addEventListener("message", handler);
          worker.postMessage({ file, targetFormat, quality, options: { mimeType: targetFormat, quality: quality / 100 } });
        });
        resultBlob = new Blob([convertedBuffer], { type: targetFormat });
      } else {
        resultBlob = file;
      }

      const resultUrl = URL.createObjectURL(resultBlob);
      const resultObj = {
        filename: newFilename,
        blob: resultBlob,
        url: resultUrl,
        size: resultBlob.size,
        originalSize: file.size,
        type: resultBlob.type,
      };

      if (autoUpload) {
        try {
          const uploadedUrl = await uploadSingleResult(resultObj);
          resultObj.uploadedUrl = uploadedUrl;
        } catch (upErr) {
          console.error("Upload error:", upErr);
        }
      }

      if (autoDownload) {
        downloadFile(resultUrl, newFilename);
      }

      state.results.push(resultObj);
      renderResults();
    } catch (err) {
      console.error(`File processing error [${file.name}]:`, err);
    }

    const progress = Math.round(((i + 1) / state.files.length) * 100);
    updateProgress(progress);
    updateStatus(`${i + 1} / ${state.files.length} 完了`);
  }

  updateStatus("変換完了");
  if (autoUpload) fetchAndRenderR2Files();
}

// ダイレクト S3 アップロード
async function uploadSingleResult(resultObj) {
  const s3 = getS3Client();
  const bucket = r2BucketName.value.trim();
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!s3 || !bucket) {
    throw new Error(dict.missingConfig);
  }

  const arrayBuffer = await resultObj.blob.arrayBuffer();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: resultObj.filename,
    Body: new Uint8Array(arrayBuffer),
    ContentType: resultObj.type || "application/octet-stream",
  });

  await s3.send(command);

  const baseUrl = getR2PublicBaseUrl();
  return baseUrl ? `${baseUrl}/${resultObj.filename}` : resultObj.filename;
}

// 直接アップロード (変換なし)
async function uploadRawFiles(applyRename = false) {
  if (!state.files.length) return;

  const s3 = getS3Client();
  const bucket = r2BucketName.value.trim();
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!s3 || !bucket) {
    alert(dict.missingConfig);
    return;
  }

  state.results = [];
  renderResults();
  updateProgress(0);

  const pattern = renamePattern.value.trim() || "{name}";
  updateStatus(`0 / ${state.files.length} アップロード中...`);

  for (let i = 0; i < state.files.length; i++) {
    const file = state.files[i];
    let uploadName = file.name;

    if (applyRename) {
      const extIndex = file.name.lastIndexOf(".");
      const ext = extIndex !== -1 ? file.name.slice(extIndex + 1) : "";
      uploadName = generateFilename(pattern, file, i, ext);
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: uploadName,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type || "application/octet-stream",
      });

      await s3.send(command);

      const baseUrl = getR2PublicBaseUrl();
      const uploadedUrl = baseUrl ? `${baseUrl}/${uploadName}` : uploadName;

      state.results.push({
        filename: uploadName,
        blob: file,
        url: URL.createObjectURL(file),
        size: file.size,
        originalSize: file.size,
        type: file.type,
        uploadedUrl,
        isNonImage: true,
      });
      renderResults();
    } catch (err) {
      console.error(`Upload raw error [${file.name}]:`, err);
    }

    const progress = Math.round(((i + 1) / state.files.length) * 100);
    updateProgress(progress);
    updateStatus(`${i + 1} / ${state.files.length} アップロード完了`);
  }

  updateStatus("完了");
  fetchAndRenderR2Files();
}

function downloadFile(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// S3 でのオブジェクトリネーム (Copy ➔ Delete)
async function renameR2Object(oldKey, newKey) {
  const s3 = getS3Client();
  const bucket = r2BucketName.value.trim();
  if (!s3 || !bucket || !oldKey || !newKey || oldKey === newKey) return;

  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: encodeURIComponent(`${bucket}/${oldKey}`),
    Key: newKey,
  });
  await s3.send(copyCommand);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: oldKey,
  });
  await s3.send(deleteCommand);
}

// R2 ストレージのファイル一覧取得 ＆ 描画 (目標UI準拠)
async function fetchAndRenderR2Files() {
  const s3 = getS3Client();
  const bucket = r2BucketName.value.trim();
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!s3 || !bucket) {
    if (r2FileList) {
      r2FileList.innerHTML = `<span class="item-meta" style="padding: 18px;">${dict.missingConfig}</span>`;
    }
    return;
  }

  try {
    const command = new ListObjectsV2Command({ Bucket: bucket });
    const data = await s3.send(command);

    const baseUrl = getR2PublicBaseUrl();
    const devUrl = getR2DevBaseUrl();
    const rawObjects = data.Contents || [];
    let files = rawObjects
      .filter(obj => !obj.Key.startsWith(".system/"))
      .map(obj => ({
        key: obj.Key,
        size: obj.Size,
        uploaded: obj.LastModified,
        url: baseUrl ? `${baseUrl}/${obj.Key}` : obj.Key,
        devUrl: devUrl ? `${devUrl}/${obj.Key}` : obj.Key,
      }));

    // 🧹 7日以上経過したファイル（📌永続化を除く）の自動削除
    if (autoCleanupCheckbox && autoCleanupCheckbox.checked) {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const expiredKeys = files
        .filter(f => !f.key.startsWith("keep/") && (now - new Date(f.uploaded).getTime()) > SEVEN_DAYS_MS)
        .map(f => f.key);

      if (expiredKeys.length > 0) {
        try {
          const deleteCmd = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: expiredKeys.map(k => ({ Key: k })) },
          });
          await s3.send(deleteCmd);
          const expiredSet = new Set(expiredKeys);
          files = files.filter(f => !expiredSet.has(f.key));
        } catch (cleanErr) {
          console.error("Auto cleanup error:", cleanErr);
        }
      }
    }

    paletteFiles = files.map(f => ({ key: f.key, url: f.url }));
    renderUrlPalette();

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    state.r2TotalSize = totalSize;
    updateStorageUsageUI();

    r2FileList.innerHTML = "";
    if (!files.length) {
      r2FileList.innerHTML = `<span class="item-meta" style="padding: 18px;">${dict.noFilesR2}</span>`;
      updateR2BatchButtons();
      return;
    }

    files.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

    files.forEach(file => {
      const item = document.createElement("div");
      item.className = "cache-file-item";

      const ext = file.key.split(".").pop().toLowerCase();
      const isMedia = /\.(jpg|jpeg|png|webp|gif|jxl|mp4|webm|mov)$/i.test(file.key);
      const isVideo = /\.(mp4|webm|mov)$/i.test(file.key);

      let mediaHtml = "";
      if (isVideo) {
        mediaHtml = `<video src="${file.url}#t=0.5" class="cache-file-thumb" preload="metadata" muted playsinline style="object-fit: cover; pointer-events: none;"></video>`;
      } else if (isMedia) {
        mediaHtml = `<img src="${file.url}" alt="${file.key}" class="cache-file-thumb" loading="lazy">`;
      } else {
        mediaHtml = `<div class="cache-file-thumb-placeholder">📄</div>`;
      }

      const isKeep = file.key.startsWith("keep/");
      const keepBadge = isKeep ? '<span class="badge-keep">📌 永続化</span>' : "";

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
          <input type="checkbox" class="r2-file-checkbox" data-key="${escapeHtml(file.key)}" style="width: 18px; height: 18px; cursor: pointer;">
          <a href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer" class="thumb-link" title="画像を表示">
            ${mediaHtml}
          </a>
          <div class="cache-file-info" style="flex: 1; min-width: 0;">
            <div class="cache-file-name-container" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="cache-file-name" title="${escapeHtml(file.key)}">${escapeHtml(file.key)}</span>
              ${keepBadge}
              <button type="button" class="edit-btn rename-trigger-btn" data-key="${escapeHtml(file.key)}" title="ファイル名を変更">✏️</button>
            </div>
            <div class="cache-file-meta">
              <span>${formatSize(file.size)}</span>
              <span>📅 ${new Date(file.uploaded).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div class="cache-file-actions" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <label class="storage-persist-label" style="display: inline-flex; align-items: center; gap: 4px; cursor: pointer;" title="自動削除対象から保護します">
            <input type="checkbox" class="storage-persist-checkbox" data-key="${escapeHtml(file.key)}" ${isKeep ? "checked" : ""}>
            <span style="font-size: 11px; color: var(--muted);">📌 永続化</span>
          </label>
          <button type="button" class="ghost-button copy-url-btn" data-url="${escapeHtml(file.url)}">${dict.copyUrl}</button>
          <button type="button" class="ghost-button dev-copy-url-btn" data-url="${escapeHtml(file.devUrl)}">${dict.devCopyUrl}</button>
          <button type="button" class="ghost-button danger-button delete-r2-btn" data-key="${escapeHtml(file.key)}">${dict.deleteNow}</button>
        </div>
      `;
      r2FileList.appendChild(item);
    });

    updateR2BatchButtons();
  } catch (err) {
    console.error("List R2 files error:", err);
    if (r2FileList) {
      r2FileList.innerHTML = `<span class="item-meta" style="padding: 18px; color: var(--danger);">${dict.s3Error}: ${err.message}</span>`;
    }
  }
}

// 選択チェックボックスの動的ボタン制御
function updateR2BatchButtons() {
  const checkboxes = document.querySelectorAll(".r2-file-checkbox:checked");
  if (deleteSelectedR2FilesButton) {
    deleteSelectedR2FilesButton.style.display = checkboxes.length > 0 ? "inline-flex" : "none";
  }
}

// R2 ストレージ使用量UI更新
function updateStorageUsageUI() {
  const currentBytes = state.r2TotalSize || 0;
  const limitMb = Number(storageLimitRange.value) || 1000;
  const limitBytes = limitMb * 1024 * 1024;
  const percent = limitBytes > 0 ? (currentBytes / limitBytes) * 100 : 0;
  const clampedPercent = Math.min(100, Math.round(percent * 100) / 100);

  const usageText = document.querySelector("#storageUsageText");
  const fillBar = document.querySelector("#storageUsageBar");

  if (usageText) {
    const formattedLimit = limitMb >= 1000 ? "1.0 GB" : `${(limitMb / 1000).toFixed(1)} GB`;
    usageText.textContent = `${formatSize(currentBytes)} / ${formattedLimit} (${clampedPercent.toFixed(2)}%)`;
  }
  if (fillBar) {
    fillBar.value = clampedPercent;
  }
}

// 単一ファイル削除
async function deleteR2File(key) {
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;
  if (!confirm(dict.confirmSingleDelete.replace("{key}", key))) return;

  const s3 = getS3Client();
  const bucket = r2BucketName.value.trim();

  try {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await s3.send(command);
    fetchAndRenderR2Files();
  } catch (err) {
    alert(`${dict.failed}: ${err.message}`);
  }
}

// 選択ファイル一括削除
async function bulkDeleteR2Files() {
  const checkboxes = document.querySelectorAll(".r2-file-checkbox:checked");
  const keys = Array.from(checkboxes).map(cb => cb.getAttribute("data-key"));

  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!keys.length) {
    alert(dict.selectFileR2);
    return;
  }

  if (!confirm(dict.confirmBatchDelete.replace("{count}", keys.length))) return;

  const s3 = getS3Client();
  const bucket = r2BucketName.value.trim();

  try {
    const objectsToDelete = keys.map(k => ({ Key: k }));
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: objectsToDelete },
    });
    await s3.send(command);
    fetchAndRenderR2Files();
  } catch (err) {
    alert(`${dict.failed}: ${err.message}`);
  }
}

// 5ch 投稿用 URL パレット
let paletteFiles = [];
const composerTextarea = document.querySelector("#composerTextarea");
const paletteList = document.querySelector("#paletteList");
const templateSelect = document.querySelector("#templateSelect");
const saveTemplateButton = document.querySelector("#saveTemplateButton");
const deleteTemplateButton = document.querySelector("#deleteTemplateButton");
const copyComposerTextButton = document.querySelector("#copyComposerTextButton");
const clearComposerButton = document.querySelector("#clearComposerButton");

function renderUrlPalette() {
  if (!paletteList) return;
  paletteList.innerHTML = "";
  if (!paletteFiles.length) {
    paletteList.innerHTML = `<span style="font-size: 11px; color: var(--muted);">ファイルはありません</span>`;
    return;
  }

  paletteFiles.forEach(f => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "palette-chip";
    chip.textContent = f.key;
    chip.title = f.url;
    chip.addEventListener("click", () => insertTextAtCursor(composerTextarea, `${f.url}\n`));
    paletteList.appendChild(chip);
  });
}

function insertTextAtCursor(textarea, text) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.substring(0, start) + text + val.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.focus();
}

function loadTemplates() {
  if (!templateSelect) return;
  const templates = JSON.parse(localStorage.getItem("postTemplates") || "[]");
  templateSelect.innerHTML = `<option value="">-- 定型文を選択 --</option>`;
  templates.forEach((t, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = t.title;
    templateSelect.appendChild(opt);
  });
}

// イベントリスナー登録
dropzone.addEventListener("dragover", e => {
  e.preventDefault();
  dropzone.classList.add("is-dragging");
});

dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragging"));

dropzone.addEventListener("drop", async e => {
  e.preventDefault();
  dropzone.classList.remove("is-dragging");
  if (e.dataTransfer.files.length) {
    addFiles(e.dataTransfer.files);
  }
});

fileInput.addEventListener("change", e => {
  if (e.target.files.length) {
    addFiles(e.target.files);
  }
});

folderSelectButton.addEventListener("click", () => folderInput.click());
folderInput.addEventListener("change", e => {
  if (e.target.files.length) {
    addFiles(e.target.files);
  }
});

fileList.addEventListener("click", e => {
  if (e.target.classList.contains("delete-button")) {
    const index = Number(e.target.getAttribute("data-index"));
    if (!isNaN(index) && index >= 0 && index < state.files.length) {
      state.files.splice(index, 1);
      render();
    }
  }
});

clearButton.addEventListener("click", () => {
  state.files = [];
  state.results = [];
  render();
});

formatSelect.addEventListener("change", () => localStorage.setItem("formatSelect", formatSelect.value));
qualityRange.addEventListener("input", () => {
  qualityOutput.textContent = qualityRange.value;
  localStorage.setItem("qualityRange", qualityRange.value);
});

renamePattern.addEventListener("input", () => localStorage.setItem("renamePattern", renamePattern.value));
clearRenamePattern.addEventListener("click", () => {
  renamePattern.value = "";
  localStorage.setItem("renamePattern", "");
});

document.querySelectorAll(".tag-button").forEach(btn => {
  btn.addEventListener("click", () => {
    const tag = btn.getAttribute("data-insert");
    renamePattern.value += tag;
    localStorage.setItem("renamePattern", renamePattern.value);
  });
});

storageLimitRange.addEventListener("input", () => {
  updateLimitOutput(storageLimitRange.value);
  localStorage.setItem("storageLimit", storageLimitRange.value);
  updateStorageUsageUI();
});

convertButton.addEventListener("click", () => processImages(false, false));
convertDownloadButton.addEventListener("click", () => processImages(true, false));
convertUploadButton.addEventListener("click", () => processImages(false, true));
uploadRenameButton.addEventListener("click", () => uploadRawFiles(true));
uploadOriginalButton.addEventListener("click", () => uploadRawFiles(false));

resultList.addEventListener("click", async e => {
  if (e.target.classList.contains("download-single-btn")) {
    const idx = Number(e.target.getAttribute("data-index"));
    const res = state.results[idx];
    if (res) downloadFile(res.url, res.filename);
  } else if (e.target.classList.contains("upload-single-btn")) {
    const idx = Number(e.target.getAttribute("data-index"));
    const res = state.results[idx];
    if (res) {
      try {
        res.uploadedUrl = await uploadSingleResult(res);
        renderResults();
        fetchAndRenderR2Files();
      } catch (err) {
        alert(`アップロード失敗: ${err.message}`);
      }
    }
  }
});

uploadAllButton.addEventListener("click", async () => {
  for (const res of state.results) {
    if (!res.uploadedUrl) {
      try {
        res.uploadedUrl = await uploadSingleResult(res);
      } catch (err) {
        console.error("Upload all error:", err);
      }
    }
  }
  renderResults();
  fetchAndRenderR2Files();
});

cfSaveButton.addEventListener("click", saveCfSettings);
cfClearButton.addEventListener("click", clearCfSettings);
cfShareQrButton.addEventListener("click", shareConnectionQr);
closeQrModalButton.addEventListener("click", () => (qrModal.style.display = "none"));

if (langSelect) {
  langSelect.addEventListener("change", () => setAppLanguage(langSelect.value));
}

if (reloadR2FilesButton) reloadR2FilesButton.addEventListener("click", fetchAndRenderR2Files);
if (deleteSelectedR2FilesButton) deleteSelectedR2FilesButton.addEventListener("click", bulkDeleteR2Files);

if (selectAllR2Checkbox) {
  selectAllR2Checkbox.addEventListener("change", e => {
    document.querySelectorAll(".r2-file-checkbox").forEach(cb => (cb.checked = e.target.checked));
    updateR2BatchButtons();
  });
}

// R2 ストレージ内のファイル操作イベントハンドラ (ペンリネーム ＆ 永続化トグル ＆ コピー ＆ devコピー ＆ 削除)
if (r2FileList) {
  r2FileList.addEventListener("change", async e => {
    if (e.target.classList.contains("r2-file-checkbox")) {
      updateR2BatchButtons();
    } else if (e.target.classList.contains("storage-persist-checkbox")) {
      const oldKey = e.target.getAttribute("data-key");
      const isChecked = e.target.checked;

      let newKey = oldKey;
      if (isChecked && !oldKey.startsWith("keep/")) {
        newKey = `keep/${oldKey}`;
      } else if (!isChecked && oldKey.startsWith("keep/")) {
        newKey = oldKey.replace(/^keep\//, "");
      }

      if (newKey !== oldKey) {
        try {
          await renameR2Object(oldKey, newKey);
          fetchAndRenderR2Files();
        } catch (err) {
          alert(`永続化変更エラー: ${err.message}`);
          e.target.checked = !isChecked;
        }
      }
    }
  });

  r2FileList.addEventListener("click", async e => {
    // ✏️ ペンアイコンボタン（インラインリネーム表示）
    if (e.target.classList.contains("rename-trigger-btn")) {
      const oldKey = e.target.getAttribute("data-key");
      const nameContainer = e.target.closest(".cache-file-name-container");
      if (!nameContainer) return;

      const isKeep = oldKey.startsWith("keep/");
      const cleanKey = isKeep ? oldKey.replace(/^keep\//, "") : oldKey;
      const lastDot = cleanKey.lastIndexOf(".");
      const baseName = lastDot !== -1 ? cleanKey.slice(0, lastDot) : cleanKey;
      const ext = lastDot !== -1 ? cleanKey.slice(lastDot) : "";

      nameContainer.innerHTML = `
        <div class="rename-form">
          <input type="text" class="rename-input" value="${escapeHtml(baseName)}" data-oldkey="${escapeHtml(oldKey)}" data-ext="${escapeHtml(ext)}" data-keep="${isKeep}">
          <div class="rename-button-group">
            <button type="button" class="rename-btn save">保存</button>
            <button type="button" class="rename-btn cancel">戻る</button>
          </div>
        </div>
      `;
    }

    // リネームキャンセル
    if (e.target.classList.contains("cancel") && e.target.classList.contains("rename-btn")) {
      fetchAndRenderR2Files();
    }

    // リネーム保存実行
    if (e.target.classList.contains("save") && e.target.classList.contains("rename-btn")) {
      const form = e.target.closest(".rename-form");
      const input = form?.querySelector(".rename-input");
      if (!input) return;

      const oldKey = input.getAttribute("data-oldkey");
      const ext = input.getAttribute("data-ext");
      const isKeep = input.getAttribute("data-keep") === "true";
      const newBase = input.value.trim();

      if (!newBase) {
        alert("ファイル名を入力してください。");
        return;
      }

      let newKey = `${newBase}${ext}`;
      if (isKeep && !newKey.startsWith("keep/")) {
        newKey = `keep/${newKey}`;
      }

      if (newKey !== oldKey) {
        try {
          await renameR2Object(oldKey, newKey);
          fetchAndRenderR2Files();
        } catch (err) {
          alert(`リネーム失敗: ${err.message}`);
        }
      } else {
        fetchAndRenderR2Files();
      }
    }

    // コピーボタン
    if (e.target.classList.contains("copy-url-btn")) {
      const url = e.target.getAttribute("data-url");
      navigator.clipboard.writeText(url).then(() => {
        const lang = getAppLanguage();
        const dict = i18nDict[lang] || i18nDict.ja;
        const originalText = e.target.textContent;
        e.target.textContent = dict.copied;
        setTimeout(() => (e.target.textContent = originalText), 1500);
      });
    }

    // devコピーボタン
    if (e.target.classList.contains("dev-copy-url-btn")) {
      const devUrl = e.target.getAttribute("data-url");
      navigator.clipboard.writeText(devUrl).then(() => {
        const lang = getAppLanguage();
        const dict = i18nDict[lang] || i18nDict.ja;
        const originalText = e.target.textContent;
        e.target.textContent = dict.copied;
        setTimeout(() => (e.target.textContent = originalText), 1500);
      });
    }

    // 削除ボタン
    if (e.target.classList.contains("delete-r2-btn")) {
      const key = e.target.getAttribute("data-key");
      deleteR2File(key);
    }
  });
}

// 5ch 文章コピー
if (copyComposerTextButton && composerTextarea) {
  copyComposerTextButton.addEventListener("click", () => {
    const text = composerTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
      const lang = getAppLanguage();
      const dict = i18nDict[lang] || i18nDict.ja;
      const orig = copyComposerTextButton.textContent;
      copyComposerTextButton.textContent = dict.copied;
      setTimeout(() => (copyComposerTextButton.textContent = orig), 1500);
    });
  });
}

if (clearComposerButton && composerTextarea) {
  clearComposerButton.addEventListener("click", () => {
    composerTextarea.value = "";
  });
}

[r2AccountId, r2BucketName, r2AccessKeyId, r2SecretAccessKey, r2PublicDomain, r2DevDomain].forEach(el => {
  el?.addEventListener("input", saveCfSettingsAuto);
});

if (autoCleanupCheckbox) {
  autoCleanupCheckbox.addEventListener("change", () => {
    localStorage.setItem("autoCleanup7Days", String(autoCleanupCheckbox.checked));
    if (autoCleanupCheckbox.checked) {
      fetchAndRenderR2Files();
    }
  });
}

// 初期化
parseUrlConfigHash();
loadSettings();
fetchAndRenderR2Files();
