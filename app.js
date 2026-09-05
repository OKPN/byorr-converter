import QRCode from "qrcode";
import encodeJxl, { init as initJxl } from "@jsquash/jxl/encode.js";
import jxlWasmUrl from "@jsquash/jxl/codec/enc/jxl_enc.wasm?url";

let jxlInitialized = false;
async function ensureJxl() {
  if (!jxlInitialized) {
    try {
      const res = await fetch(jxlWasmUrl);
      if (!res.ok) throw new Error(`WASM fetch failed: HTTP ${res.status}`);
      const wasmBytes = await res.arrayBuffer();
      const wasmModule = await WebAssembly.compile(wasmBytes);
      await initJxl(wasmModule);
      jxlInitialized = true;
    } catch (e) {
      console.error("Failed to init JXL encoder:", e);
      throw e;
    }
  }
}
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
    whatIsSiteBody: `外部サーバやWorkerを一切介さず、お使いのブラウザ内だけで画像をセキュアに変換し、ご自身の Cloudflare R2 ストレージ（S3互換）にダイレクト保存・配信できるローカル＆R2専用ツールです。<br><span style="display: inline-block; margin-top: 6px; font-size: 12px; color: #a5b4fc;">※接続情報は全てお使いのブラウザ内（localStorage）にのみセキュア保存されます。</span>`,
    inputFiles: "入力ファイル",
    addFolder: "フォルダを追加",
    dropText: "画像やフォルダをここにドロップ",
    orClick: "またはクリックしてファイルを選択",
    settings: "設定",
    enableConvertLabel: "画像を変換する",
    enableRenameLabel: "ファイル名をリネームする",
    outputFormat: "出力形式",
    quality: "品質",
    renameRule: "リネーム規則",
    originalName: "元ファイル名",
    seq01: "連番 (01)",
    seq001: "連番 (001)",
    random6: "ランダム (6文字)",
    previewLabel: "プレビュー:",
    zipOptionLabel: "🗜️ ZIP形式でまとめて保存する",
    btnDownload: "📥 ダウンロード",
    btnUpload: "🟩 アップロード",
    btnConvertUpload: "🟩 アップロード",
    cfTitle: "☁️ Cloudflare R2 接続設定 (S3 API)",
    r2AccountLabel: "Account ID",
    r2AccountSub: "Cloudflare アカウント ID（S3 API URLを貼り付けても自動抽出されます）",
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
    btnShareQr: "📱 スマホ共有 (QR)",
    btnPinBackup: "🔗 PINバックアップ",
    btnClear: "クリア",
    topbarSyncBtn: "スマホ共有 / バックアップ",
    dataSyncHeading: "📦 設定の引き継ぎ & スマホ共有",
    dataSyncDesc: "Civitai ウォッチリスト、Cloudflare R2 接続情報、画像変換設定を別の端末やスマホへ安全に引き継ぎます。",
    btnClearAllData: "🗑️ 全クリア",
    qrModalTitle: "📱 スマホ/別端末でスキャン",
    qrModalSub: "スマホのカメラ等で下記QRコードを読み取ると、Civitaiウォッチリストや接続設定が安全に直接引き継がれます。",
    civitaiGalleryHeading: "🎨 Civitai ギャラリー & クリエイターウォッチ",
    civitaiUsernameLabel: "👤 クリエイター:",
    civitaiNoCreator: "(未登録 - ＋から追加)",
    civitaiEmptyDesc: "Civitai クリエイターが登録されていません。「＋」ボタンから気になるクリエイター名を追加してください。",
    civitaiAddCreator: "➕ ウォッチするクリエイターを追加:",
    civitaiMarkRead: "✓ 既読にする",
    civitaiNewBadge: "{count}件の新着",
    civitaiDeleteConfirm: "登録クリエイター「{name}」をウォッチリストから削除しますか？",
    civitaiLastOneError: "最低1件のクリエイター登録が必要です。",
    btnAdd: "追加",
    btnCancel: "キャンセル",
    r2Notice: "ブラウザから Cloudflare R2 ストレージへダイレクトに通信します（バックエンド Worker 不要）。事前に R2 バケットの設定で CORS（Cross-Origin Resource Sharing）を許可してください。",
    statusWaiting: "待機中",
    statusReady: "準備完了",
    textComposerHeading: "💬 テキスト作成支援",
    templateLabel: "定型文:",
    promptSave: "定型文を保存",
    promptDelete: "削除",
    btnInsertUrlTag: "＋ {url} を挿入",
    paletteNote: "クリックしてURLを本文（カーソル位置）に挿入:",
    composerPlaceholder: "ここにチャット等に投稿する文章を書きます。上の画像をクリックしてURLを挿入したり、定型文をロードできます。",
    btnPromptCopy: "文章をコピーする",
    r2Heading: "⚡ Cloudflare R2 ストレージ内のファイル",
    limitLabel: "上限:",
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
    promptSelect: "-- 定型文を選択 --",
    promptNew: "＋ 新規定型文として保存",
    promptNameInput: "定型文のタイトルを入力してください:",
    promptOverwriteConfirm: "既存の定型文 '{name}' を上書きしますか？",
    promptSaveSuccess: "定型文 '{name}' を保存しました！",
    promptDeleteConfirm: "定型文 '{name}' を削除しますか？",
    promptEmptyNotice: "定型文の内容が空です。",
  },
  en: {
    siteTitle: "BYORR Converter",
    eyebrow: "Secure in-browser image conversion & direct Cloudflare R2 upload!",
    whatIsSiteSummary: "❓ What is this site?",
    whatIsSiteBody: `
      <div style="font-size: 13px; line-height: 1.6; color: var(--text);">
        <p style="margin-bottom: 12px; font-weight: 500;">
          <strong>BYORR (Bring Your Own R2) Converter</strong> is a 100% serverless, client-side tool built for AI creators. Convert images in your browser and upload them directly to your personal Cloudflare R2 bucket via S3 API — without any intermediate server or Worker.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; margin: 14px 0;">
          <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 10px 12px;">
            <div style="font-weight: bold; color: #818cf8; margin-bottom: 3px;">🔒 Zero External Servers</div>
            <div style="font-size: 11.5px; color: var(--muted);">Direct S3 API communication from your browser to Cloudflare R2. No backend, no proxy, maximum privacy.</div>
          </div>
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 10px 12px;">
            <div style="font-weight: bold; color: #34d399; margin-bottom: 3px;">🧬 ComfyUI Workflows Intact</div>
            <div style="font-size: 11.5px; color: var(--muted);">Preserves complete ComfyUI node graph workflows and API prompts in PNG, WebP, and MP4/WebM videos.</div>
          </div>
          <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 10px 12px;">
            <div style="font-weight: bold; color: #38bdf8; margin-bottom: 3px;">📦 Massive 10 GB Free Tier</div>
            <div style="font-size: 11.5px; color: var(--muted);">Take advantage of Cloudflare R2's generous 10GB free storage every month with zero egress fees.</div>
          </div>
        </div>

        <h4 style="font-size: 13.5px; font-weight: bold; color: #fff; margin: 16px 0 8px 0; display: flex; align-items: center; gap: 6px;">
          🚀 Quick Setup Guide (3 Simple Steps)
        </h4>

        <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
          <li>
            <strong>Step 1: Create an R2 Bucket in Cloudflare</strong><br>
            Log into your Cloudflare Dashboard, navigate to <strong>R2 Object Storage</strong>, and create a bucket (e.g. <code>my-images</code>).
          </li>
          <li>
            <strong>Step 2: Generate S3 API Credentials</strong><br>
            Under <strong>R2 > Manage R2 API Tokens</strong>, create an API token with <code>Object Read & Write</code> permissions. Note your <strong>Access Key ID</strong>, <strong>Secret Access Key</strong>, and <strong>Account ID</strong>.
          </li>
          <li>
            <strong>Step 3: Connect in Settings Below</strong><br>
            Paste your Account ID, Bucket Name, and API Keys into the <strong>☁️ Cloudflare R2 Connection Settings</strong> panel below. You are now ready to publish direct links!
          </li>
        </ol>

        <div style="margin-top: 14px; padding: 10px 12px; background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 11.5px; color: var(--muted);">
          <strong style="color: #fbbf24;">🛡️ Privacy & Security Guarantee:</strong><br>
          Your R2 API keys are stored solely inside your browser's local storage (<code>localStorage</code>) and are transmitted only directly to Cloudflare's official S3 endpoint. We never store or see your keys.
        </div>
      </div>
    `,
    inputFiles: "Input Files",
    addFolder: "Add Folder",
    dropText: "Drop images or folders here",
    orClick: "or click to select files",
    settings: "Settings",
    enableConvertLabel: "Convert Images",
    enableRenameLabel: "Rename Files",
    outputFormat: "Output Format",
    quality: "Quality",
    renameRule: "Rename Pattern",
    originalName: "Original Name",
    seq01: "Sequence (01)",
    seq001: "Sequence (001)",
    random6: "Random (6 chars)",
    previewLabel: "Preview:",
    zipOptionLabel: "🗜️ Save all in ZIP archive",
    btnDownload: "📥 Download",
    btnUpload: "🟩 Upload",
    btnConvertUpload: "🟩 Upload",
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
    btnPinBackup: "🔗 PIN Backup",
    btnClear: "Clear",
    topbarSyncBtn: "Sync / Backup",
    dataSyncHeading: "📦 Settings Sync & Mobile Sharing",
    dataSyncDesc: "Securely sync Civitai creators watch list, Cloudflare R2 credentials, and converter settings to mobile or other devices.",
    btnClearAllData: "🗑️ Clear All",
    qrModalTitle: "📱 Scan with Mobile / Other Device",
    qrModalSub: "Scan this QR code with your mobile camera to securely transfer your Civitai watch list, connection settings, and preferences.",
    civitaiGalleryHeading: "🎨 Civitai Gallery & Watcher",
    civitaiUsernameLabel: "👤 Creator:",
    civitaiNoCreator: "(No creators - click ＋ to add)",
    civitaiEmptyDesc: "No Civitai creators registered. Click \"＋\" to add a creator to your watch list.",
    civitaiAddCreator: "➕ Add Creator to Watch:",
    civitaiMarkRead: "✓ Mark as Read",
    civitaiNewBadge: "{count} New",
    civitaiDeleteConfirm: "Remove creator \"{name}\" from your watch list?",
    civitaiLastOneError: "At least one creator must be kept.",
    btnAdd: "Add",
    btnCancel: "Cancel",
    r2Notice: "Communicates directly with Cloudflare R2 via S3 API (no worker needed). Please allow CORS on your R2 bucket settings.",
    statusWaiting: "Waiting",
    statusReady: "Ready",
    textComposerHeading: "💬 Text Composer",
    templateLabel: "Template:",
    promptSave: "Save Template",
    promptDelete: "Delete",
    btnInsertUrlTag: "＋ Insert {url}",
    paletteNote: "Click image to insert URL at cursor:",
    composerPlaceholder: "Write your post here. Click images above to insert direct URLs.",
    btnPromptCopy: "Copy Post Text",
    r2Heading: "⚡ Files in Cloudflare R2 Storage",
    limitLabel: "Limit:",
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
    promptSelect: "-- Select template --",
    promptNew: "+ Save as new template",
    promptNameInput: "Enter title for template:",
    promptOverwriteConfirm: "Overwrite existing template '{name}'?",
    promptSaveSuccess: "Template '{name}' saved!",
    promptDeleteConfirm: "Delete template '{name}'?",
    promptEmptyNotice: "Template content is empty.",
  }
};

// --- アプリケーション状態 ---
const state = {
  files: [],
  results: [],
  r2TotalSize: 0,
};

let paletteFiles = [];

const extensions = {
  "image/webp": "webp",
  "image/jxl": "jxl",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const defaultTemplates = {
  "standard": {
    name: "基本の挨拶",
    text: "お世話になっております。\n画像を添付いたします。\n\n{url}"
  }
};

// --- DOM 要素 ---
const fileInput = document.querySelector("#fileInput");
const folderInput = document.querySelector("#folderInput");
const folderSelectButton = document.querySelector("#folderSelectButton");
const dropzone = document.querySelector("#dropzone");
const fileList = document.querySelector("#fileList");
const fileCount = document.querySelector("#fileCount");
const statusText = document.querySelector("#statusText");
const progressBar = document.querySelector("#progressBar");

// 設定要素
const enableConvertCheck = document.querySelector("#enableConvertCheck");
const convertSettingsArea = document.querySelector("#convertSettingsArea");
const enableRenameCheck = document.querySelector("#enableRenameCheck");
const renameSettingsArea = document.querySelector("#renameSettingsArea");
const formatSelect = document.querySelector("#formatSelect");
const qualityRange = document.querySelector("#qualityRange");
const qualityOutput = document.querySelector("#qualityOutput");
const renamePattern = document.querySelector("#renamePattern");
const clearRenamePattern = document.querySelector("#clearRenamePattern");
const enableZipCheck = document.querySelector("#enableZipCheck");

// アクションボタン
const convertDownloadButton = document.querySelector("#convertDownloadButton");
const convertUploadButton = document.querySelector("#convertUploadButton");
const clearButton = document.querySelector("#clearButton");

// ☁️ Cloudflare R2 接続設定フォーム要素
const r2AccountId = document.querySelector("#r2AccountId");
const r2BucketName = document.querySelector("#r2BucketName");
const r2AccessKeyId = document.querySelector("#r2AccessKeyId");
const r2SecretAccessKey = document.querySelector("#r2SecretAccessKey");
const r2DomainSelect = document.querySelector("#r2DomainSelect");
const r2DomainAddBtn = document.querySelector("#r2DomainAddBtn");
const r2DomainDeleteBtn = document.querySelector("#r2DomainDeleteBtn");
const r2DomainAddForm = document.querySelector("#r2DomainAddForm");
const r2DomainNewInput = document.querySelector("#r2DomainNewInput");
const r2DomainNewSaveBtn = document.querySelector("#r2DomainNewSaveBtn");
const r2DomainNewCancelBtn = document.querySelector("#r2DomainNewCancelBtn");
const r2PublicDomain = document.querySelector("#r2PublicDomain"); // 後方互換
const r2DevDomain = document.querySelector("#r2DevDomain"); // 後方互換

const cfStatus = document.querySelector("#cfStatus");
const cfSettingsAccordion = document.querySelector("#cfSettingsAccordion");
const cfSaveButton = document.querySelector("#cfSaveButton");
const cfClearButton = document.querySelector("#cfClearButton");
const cfShareQrButton = document.querySelector("#cfShareQrButton");
const cfBackupUrlButton = document.querySelector("#cfBackupUrlButton");
const topbarSyncButton = document.querySelector("#topbarSyncButton");
const globalClearButton = document.querySelector("#globalClearButton");

// 🎨 Civitai ギャラリー要素
const civitaiUserSelect = document.querySelector("#civitaiUserSelect");
const civitaiUserAddBtn = document.querySelector("#civitaiUserAddBtn");
const civitaiUserDeleteBtn = document.querySelector("#civitaiUserDeleteBtn");
const civitaiUserAddForm = document.querySelector("#civitaiUserAddForm");
const civitaiUserNewInput = document.querySelector("#civitaiUserNewInput");
const civitaiUserNewSaveBtn = document.querySelector("#civitaiUserNewSaveBtn");
const civitaiUserNewCancelBtn = document.querySelector("#civitaiUserNewCancelBtn");
const civitaiNewBadge = document.querySelector("#civitaiNewBadge");
const civitaiMarkReadBtn = document.querySelector("#civitaiMarkReadBtn");
const civitaiUsername = civitaiUserSelect; // 後方互換
const civitaiPanel = document.querySelector("#civitaiPanel");
const civitaiGalleryList = document.querySelector("#civitaiGalleryList");
const reloadCivitaiButton = document.querySelector("#reloadCivitaiButton");
const civitaiProfileLink = document.querySelector("#civitaiProfileLink");

// R2 ファイル一覧 & 容量表示要素
const r2FileList = document.querySelector("#r2FileList");
const reloadR2FilesButton = document.querySelector("#reloadR2FilesButton");
const deleteSelectedR2FilesButton = document.querySelector("#deleteSelectedR2FilesButton");
const storageLimitRange = document.querySelector("#storageLimitRange");
const storageLimitOutput = document.querySelector("#storageLimitOutput");
const storageUsageText = document.querySelector("#storageUsageText");
const storageUsageBar = document.querySelector("#storageUsageBar");
const autoCleanupCheckbox = document.querySelector("#autoCleanupCheckbox");

// テキスト作成支援要素
const templateSelect = document.querySelector("#templateSelect");
const saveTemplateButton = document.querySelector("#saveTemplateButton");
const deleteTemplateButton = document.querySelector("#deleteTemplateButton");
const insertUrlTagButton = document.querySelector("#insertUrlTagButton");
const paletteList = document.querySelector("#paletteList");
const composerTextarea = document.querySelector("#composerTextarea");
const clearComposerButton = document.querySelector("#clearComposerButton");
const copyComposerTextButton = document.querySelector("#copyComposerTextButton");

// QRコードモーダル要素
const qrModal = document.querySelector("#qrModal");
const qrCanvas = document.querySelector("#qrCanvas");
const closeQrModalButton = document.querySelector("#closeQrModalButton");

// 言語切替
const langSelect = document.querySelector("#langSelect");

function getAppLanguage() {
  const saved = localStorage.getItem("appLang");
  if (saved && (saved === "ja" || saved === "en")) return saved;
  return "en";
}

function setAppLanguage(lang) {
  localStorage.setItem("appLang", lang);
  applyLanguage(lang);
}

function applyLanguage(lang) {
  const dict = i18nDict[lang] || i18nDict.ja;
  if (langSelect) langSelect.value = lang;

  document.querySelectorAll("[data-i18n]").forEach(elem => {
    const key = elem.getAttribute("data-i18n");
    if (dict[key]) {
      if (elem.getAttribute("data-i18n-html") === "true") {
        elem.innerHTML = dict[key];
      } else {
        elem.textContent = dict[key];
      }
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(elem => {
    const key = elem.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      elem.placeholder = dict[key];
    }
  });

  updateR2Status();
  updateStorageUsageUI();
  loadTemplates(templateSelect ? templateSelect.value : "");
  render();
}

langSelect?.addEventListener("change", (e) => {
  setAppLanguage(e.target.value);
});

// --- S3 クライアント生成ヘルパー ---
let s3ClientInstance = null;

function getS3Client() {
  const accountId = (localStorage.getItem("r2AccountId") || r2AccountId?.value || "").trim();
  const accessKeyId = (localStorage.getItem("r2AccessKeyId") || r2AccessKeyId?.value || "").trim();
  const secretAccessKey = (localStorage.getItem("r2SecretAccessKey") || r2SecretAccessKey?.value || "").trim();

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  s3ClientInstance = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  return s3ClientInstance;
}

// --- 🌐 R2 公開・配信ドメイン管理 ---

function getR2DomainList() {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem("r2DomainList") || "[]");
  } catch (e) {
    list = [];
  }
  // 後方互換性：旧 r2PublicDomain / r2DevDomain からの自動移行
  const legacyPub = (localStorage.getItem("r2PublicDomain") || "").trim();
  const legacyDev = (localStorage.getItem("r2DevDomain") || "").trim();
  if (legacyPub && !list.includes(legacyPub)) list.push(legacyPub);
  if (legacyDev && !list.includes(legacyDev)) list.push(legacyDev);

  // 重複排除 & 空白除去
  return [...new Set(list.map(d => d.trim().replace(/\/$/, "")).filter(Boolean))];
}

function saveR2DomainList(list) {
  localStorage.setItem("r2DomainList", JSON.stringify(list));
}

function getSelectedR2Domain() {
  const list = getR2DomainList();
  const saved = (localStorage.getItem("r2SelectedDomain") || "").trim().replace(/\/$/, "");
  if (saved && list.includes(saved)) {
    return saved;
  }
  return list.length > 0 ? list[0] : "";
}

function setSelectedR2Domain(domain) {
  const clean = (domain || "").trim().replace(/\/$/, "");
  localStorage.setItem("r2SelectedDomain", clean);
  localStorage.setItem("r2PublicDomain", clean); // 後方互換
}

function renderR2DomainSelect() {
  if (!r2DomainSelect) return;
  const list = getR2DomainList();
  const current = getSelectedR2Domain();

  r2DomainSelect.innerHTML = "";

  if (list.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- 配信ドメインが未登録です (＋から追加) --";
    r2DomainSelect.append(opt);
    if (r2DomainDeleteBtn) r2DomainDeleteBtn.disabled = true;
    return;
  }

  if (r2DomainDeleteBtn) r2DomainDeleteBtn.disabled = false;

  list.forEach(domain => {
    const opt = document.createElement("option");
    opt.value = domain;
    let icon = "🌐 ";
    if (domain.includes(".pages.dev")) {
      icon = "⚡ ";
    } else if (domain.includes(".r2.dev")) {
      icon = "📦 ";
    }
    opt.textContent = `${icon}${domain}`;
    if (domain === current) opt.selected = true;
    r2DomainSelect.append(opt);
  });
}

// --- R2 設定状態の更新 (STEP 1のURL必須ルールを堅持) ---
function updateR2Status() {
  const accountId = (localStorage.getItem("r2AccountId") || r2AccountId?.value || "").trim();
  const bucketName = (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();
  const accessKeyId = (localStorage.getItem("r2AccessKeyId") || r2AccessKeyId?.value || "").trim();
  const secretAccessKey = (localStorage.getItem("r2SecretAccessKey") || r2SecretAccessKey?.value || "").trim();
  
  // 🔒 STEP 1: 配信ドメインが1件以上存在し、有効に選択されていること
  const selectedDomain = getSelectedR2Domain();
  const isStep1Ok = Boolean(selectedDomain && selectedDomain.trim());

  // 🔒 STEP 2 のロック制御 (STEP 1 未設定時は完全ブロック)
  const step2Box = document.querySelector("#r2KeysStepContainer");
  const step2Notice = document.querySelector("#step2Notice");
  const step2Inputs = [r2AccountId, r2BucketName, r2AccessKeyId, r2SecretAccessKey];

  if (step2Box) {
    step2Box.style.opacity = isStep1Ok ? "1" : "0.5";
    step2Box.style.pointerEvents = isStep1Ok ? "auto" : "none";
  }
  if (step2Notice) {
    step2Notice.style.display = isStep1Ok ? "none" : "inline";
    if (!isStep1Ok) {
      step2Notice.textContent = "⚠️ 上の公開・配信URLを『＋』から登録・選択してください";
    }
  }
  step2Inputs.forEach(input => {
    if (input) input.disabled = !isStep1Ok;
  });

  const isConfigured = Boolean(accountId && bucketName && accessKeyId && secretAccessKey && isStep1Ok);

  if (cfStatus) {
    if (isConfigured) {
      cfStatus.innerHTML = `<span style="color: #4caf50;">✅ R2 接続設定済み (${escapeHtml(bucketName)})</span>`;
    } else {
      cfStatus.innerHTML = `<span style="color: var(--danger);">⚠️ R2 接続設定を完了してください</span>`;
    }
  }

  if (!isConfigured && convertUploadButton) {
    convertUploadButton.disabled = true;
  }

  return isConfigured;
}

let civitaiPaletteFiles = []; // パレット用キャッシュ

// --- 🎨 Civitai クリエイター・ギャラリー管理 ---

function getCivitaiUserList() {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem("civitaiUserList") || "[]");
  } catch (e) {
    list = [];
  }
  const legacy = (localStorage.getItem("civitaiUsername") || "").trim();
  if (legacy && !list.includes(legacy)) {
    list.unshift(legacy);
    localStorage.setItem("civitaiUserList", JSON.stringify(list));
  }
  return list;
}

function saveCivitaiUserList(list) {
  localStorage.setItem("civitaiUserList", JSON.stringify(list));
}

function getCurrentCivitaiUser() {
  const list = getCivitaiUserList();
  const saved = (localStorage.getItem("civitaiUsername") || "").trim();
  if (saved && list.includes(saved)) {
    return saved;
  }
  const fallback = list[0] || "";
  if (fallback) {
    localStorage.setItem("civitaiUsername", fallback);
  } else {
    localStorage.removeItem("civitaiUsername");
  }
  return fallback;
}

function getCivitaiLastSeenMap() {
  try {
    return JSON.parse(localStorage.getItem("civitaiLastSeenMap") || "{}");
  } catch (e) {
    return {};
  }
}

function saveCivitaiLastSeenMap(map) {
  localStorage.setItem("civitaiLastSeenMap", JSON.stringify(map));
}

function updateCivitaiStatus() {
  const username = getCurrentCivitaiUser();
  if (civitaiProfileLink) {
    civitaiProfileLink.href = username ? `https://civitai.com/user/${encodeURIComponent(username)}/images` : "https://civitai.com";
  }
  return username !== "";
}

function renderCivitaiUserSelect(unreadUsers = new Set()) {
  if (!civitaiUserSelect) return;
  const list = getCivitaiUserList();
  const currentUser = getCurrentCivitaiUser();
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (list.length === 0) {
    const noCreatorText = dict.civitaiNoCreator || "(未登録 - ＋から追加)";
    civitaiUserSelect.innerHTML = `<option value="" style="background-color: #1a1c23; color: var(--muted);">${escapeHtml(noCreatorText)}</option>`;
  } else {
    civitaiUserSelect.innerHTML = list.map(u => {
      const isUnread = unreadUsers.has(u);
      const prefix = isUnread ? "🔴 👤 " : "👤 ";
      const suffix = isUnread ? (lang === "en" ? " (New)" : " (新着)") : "";
      const selected = (u === currentUser) ? " selected" : "";
      return `<option value="${escapeHtml(u)}" style="background-color: #1a1c23; color: #f8fafc;"${selected}>${prefix}${escapeHtml(u)}${suffix}</option>`;
    }).join("");
  }

  if (civitaiUserDeleteBtn) {
    const hasCurrent = Boolean(currentUser);
    civitaiUserDeleteBtn.disabled = !hasCurrent;
    civitaiUserDeleteBtn.style.opacity = hasCurrent ? "1" : "0.35";
    civitaiUserDeleteBtn.style.cursor = hasCurrent ? "pointer" : "not-allowed";
  }

  updateCivitaiStatus();
}

let isCheckingCivitaiUnread = false;
async function checkAllCivitaiCreatorsUnread() {
  if (isCheckingCivitaiUnread) return;
  isCheckingCivitaiUnread = true;
  try {
    const list = getCivitaiUserList();
    const lastSeenMap = getCivitaiLastSeenMap();
    const unreadSet = new Set();

    await Promise.all(list.map(async (user) => {
      const lastSeenId = Number(lastSeenMap[user] || 0);
      if (!lastSeenId) return;
      try {
        const res = await fetch(`https://civitai.com/api/v1/images?username=${encodeURIComponent(user)}&limit=1&sort=Newest&browsingLevel=127&nsfw=true&_t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        const latestItem = data.items && data.items[0];
        if (latestItem && Number(latestItem.id) > lastSeenId) {
          unreadSet.add(user);
        }
      } catch (e) {
        // network skip
      }
    }));

    renderCivitaiUserSelect(unreadSet);
  } catch (err) {
    console.debug("Civitai unread check skipped:", err);
  } finally {
    isCheckingCivitaiUnread = false;
  }
}

async function checkCivitaiItemWf(item) {
  if (!item || !item.url) return false;

  let store = {};
  try {
    store = JSON.parse(localStorage.getItem("civitaiWfMap") || "{}");
  } catch (e) {}

  if (store[item.id] !== undefined) return store[item.id];

  try {
    const res = await fetch(item.url, { headers: { Range: "bytes=0-131072" } });
    if (res.ok || res.status === 206) {
      const buf = await res.arrayBuffer();
      const text = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buf));
      const hasWf = (text.includes('"nodes"') && text.includes('"links"')) ||
                    (text.includes('"inputs"') && text.includes('"class_type"')) ||
                    text.includes('"workflow"');
      store[item.id] = hasWf;
      localStorage.setItem("civitaiWfMap", JSON.stringify(store));
      return hasWf;
    }
  } catch (err) {
    console.debug("Civitai WF check skipped:", err);
  }
  return false;
}

async function fetchAndRenderCivitaiGallery() {
  const username = getCurrentCivitaiUser();
  if (!civitaiGalleryList) return;

function createCivitaiStatsHtml(stats) {
  if (!stats) return "";
  const hearts = stats.heartCount || 0;
  const likes = stats.likeCount || 0;
  const laughs = stats.laughCount || 0;
  const cries = stats.cryCount || 0;
  const comments = stats.commentCount || 0;
  const total = hearts + likes + laughs + cries + comments;
  if (total === 0) return "";

  const badges = [];
  if (hearts > 0) {
    badges.push(`<span style="display: inline-flex; align-items: center; gap: 3px; color: #f43f5e; background: rgba(244, 63, 94, 0.12); padding: 1px 6px; border-radius: 10px; border: 1px solid rgba(244, 63, 94, 0.25); font-size: 10.5px;" title="ハート: ${hearts}">❤️ <strong>${hearts.toLocaleString()}</strong></span>`);
  }
  if (likes > 0) {
    badges.push(`<span style="display: inline-flex; align-items: center; gap: 3px; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 1px 6px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.25); font-size: 10.5px;" title="いいね: ${likes}">👍 <strong>${likes.toLocaleString()}</strong></span>`);
  }
  if (laughs > 0) {
    badges.push(`<span style="display: inline-flex; align-items: center; gap: 3px; color: #fbbf24; background: rgba(251, 191, 36, 0.12); padding: 1px 6px; border-radius: 10px; border: 1px solid rgba(251, 191, 36, 0.25); font-size: 10.5px;" title="笑い: ${laughs}">😂 <strong>${laughs.toLocaleString()}</strong></span>`);
  }
  if (cries > 0) {
    badges.push(`<span style="display: inline-flex; align-items: center; gap: 3px; color: #94a3b8; background: rgba(148, 163, 184, 0.12); padding: 1px 6px; border-radius: 10px; border: 1px solid rgba(148, 163, 184, 0.25); font-size: 10.5px;" title="泣き: ${cries}">😢 <strong>${cries.toLocaleString()}</strong></span>`);
  }
  if (comments > 0) {
    badges.push(`<span style="display: inline-flex; align-items: center; gap: 3px; color: #a78bfa; background: rgba(167, 139, 250, 0.12); padding: 1px 6px; border-radius: 10px; border: 1px solid rgba(167, 139, 250, 0.25); font-size: 10.5px;" title="コメント: ${comments}">💬 <strong>${comments.toLocaleString()}</strong></span>`);
  }

  return `<div class="civitai-stats-row" style="display: flex; gap: 6px; align-items: center; margin-top: 5px; flex-wrap: wrap;">${badges.join("")}</div>`;
}

  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!username) {
    civitaiGalleryList.innerHTML = `<span class="item-meta" style="padding: 18px; color: var(--muted); text-align: center; display: block;">${escapeHtml(dict.civitaiEmptyDesc || "Civitai クリエイターが登録されていません。「＋」ボタンから気になるクリエイター名を追加してください。")}</span>`;
    return;
  }

  civitaiGalleryList.innerHTML = `<span class="status-text" style="padding: 18px;">Civitai からメディアを取得中 (${escapeHtml(username)})...</span>`;

  try {
    const res = await fetch(`https://civitai.com/api/v1/images?username=${encodeURIComponent(username)}&limit=50&sort=Newest&browsingLevel=127&nsfw=true&_t=${Date.now()}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const items = data.items || [];

    // 新着判定
    const lastSeenMap = getCivitaiLastSeenMap();
    const lastSeenId = Number(lastSeenMap[username] || 0);
    const newestId = items.length > 0 ? Number(items[0].id) : 0;

    let newItemsCount = 0;
    if (lastSeenId === 0) {
      if (newestId > 0) {
        lastSeenMap[username] = newestId;
        saveCivitaiLastSeenMap(lastSeenMap);
      }
    } else if (newestId > lastSeenId) {
      newItemsCount = items.filter(it => Number(it.id) > lastSeenId).length;
    }

    if (newItemsCount > 0) {
      if (civitaiNewBadge) {
        civitaiNewBadge.textContent = `🔴 ${(dict.civitaiNewBadge || "{count}件の新着").replace("{count}", newItemsCount)}`;
        civitaiNewBadge.style.display = "inline-flex";
      }
      if (civitaiMarkReadBtn) {
        civitaiMarkReadBtn.style.display = "inline-flex";
        civitaiMarkReadBtn.onclick = () => {
          lastSeenMap[username] = newestId;
          saveCivitaiLastSeenMap(lastSeenMap);
          if (civitaiNewBadge) civitaiNewBadge.style.display = "none";
          if (civitaiMarkReadBtn) civitaiMarkReadBtn.style.display = "none";
          document.querySelectorAll(".civitai-new-item-badge").forEach(el => el.remove());
          checkAllCivitaiCreatorsUnread();
        };
      }
    } else {
      if (civitaiNewBadge) civitaiNewBadge.style.display = "none";
      if (civitaiMarkReadBtn) civitaiMarkReadBtn.style.display = "none";
    }

    civitaiPaletteFiles = items.map(item => {
      const isVideo = item.type === "video";
      const directUrl = item.url;
      const previewSrc = isVideo ? directUrl : (directUrl.includes("/original=true/") ? directUrl.replace("/original=true/", "/width=450/") : directUrl);
      return {
        key: `Civitai ID:${item.id}`,
        url: directUrl,
        previewUrl: previewSrc,
        isVideo,
        isCivitai: true,
      };
    });
    renderUrlPalette();

    civitaiGalleryList.innerHTML = "";
    if (items.length === 0) {
      civitaiGalleryList.innerHTML = `<span class="item-meta" style="padding: 18px;">Civitai に投稿されたメディアが見つかりませんでした。</span>`;
      return;
    }

    items.forEach(item => {
      const isNewItem = (lastSeenId > 0 && Number(item.id) > lastSeenId);
      const article = document.createElement("article");
      article.className = "result-item";

      const isVideo = item.type === "video";
      const directUrl = item.url;
      const civitaiPostPageUrl = `https://civitai.com/images/${item.id}`;

      let thumbHtml = "";
      if (isVideo) {
        thumbHtml = `<video class="thumb" src="${escapeHtml(directUrl)}" preload="metadata" muted playsinline style="object-fit: cover; pointer-events: none;"></video>`;
      } else {
        const previewSrc = directUrl.includes("/original=true/") ? directUrl.replace("/original=true/", "/width=450/") : directUrl;
        thumbHtml = `<img class="thumb" alt="" src="${escapeHtml(previewSrc)}" loading="lazy">`;
      }

      const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
      const dimensions = item.width && item.height ? `${item.width}×${item.height}` : "";

      article.innerHTML = `
        <a href="${escapeHtml(directUrl)}" target="_blank" rel="noopener noreferrer" class="thumb-link" title="直リンクを表示">
          ${thumbHtml}
        </a>
        <div class="item-info-container" style="flex: 1; min-width: 0;">
          <div class="item-name-row" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="item-name" style="font-weight: 600; font-size: 12px; font-family: monospace;">ID: ${escapeHtml(String(item.id))}</span>
            ${isNewItem ? `<span class="civitai-new-item-badge" style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: bold;">✨ NEW</span>` : ""}
            <span class="format-badge" style="font-size: 10px; padding: 1px 5px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;">${isVideo ? "🎬 VIDEO" : "🖼️ IMAGE"}</span>
            <span class="civitai-wf-badge-placeholder" data-id="${item.id}"></span>
            ${item.nsfwLevel && item.nsfwLevel !== "None" ? `<span style="font-size: 10px; padding: 1px 5px; border-radius: 4px; background: rgba(244, 63, 94, 0.15); color: #f43f5e; font-weight: bold;">${escapeHtml(item.nsfwLevel)}</span>` : ""}
            ${dimensions ? `<span style="color: #64748b; font-size: 11px;">${escapeHtml(dimensions)}</span>` : ""}
          </div>
          <div class="item-meta" style="color: var(--muted); margin-top: 4px; font-size: 11px;">
            投稿日: ${escapeHtml(dateStr)} · <a href="${escapeHtml(civitaiPostPageUrl)}" target="_blank" rel="noopener noreferrer" style="color: #818cf8; text-decoration: none;">Civitai 投稿ページ ↗</a>
          </div>
          ${createCivitaiStatsHtml(item.stats)}
        </div>
        <div class="result-actions" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="ghost-button civitai-copy-btn" data-url="${escapeHtml(directUrl)}">${escapeHtml(dict.copyUrl || "URLコピー")}</button>
          <a href="${escapeHtml(civitaiPostPageUrl)}" target="_blank" rel="noopener noreferrer" class="ghost-button" style="font-size: 11px; padding: 4px 8px; text-decoration: none; color: #f43f5e; border-color: rgba(244, 63, 94, 0.3); display: inline-flex; align-items: center; justify-content: center;" title="Civitai で投稿の編集・削除を行う">🗑️ 削除/確認 ↗</a>
        </div>
      `;

      civitaiGalleryList.append(article);

      checkCivitaiItemWf(item).then(hasWf => {
        if (hasWf) {
          const badgePlaceholder = article.querySelector('.civitai-wf-badge-placeholder');
          if (badgePlaceholder) {
            badgePlaceholder.innerHTML = '<span class="meta-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600;" title="ComfyUIワークフローが完全な形で含まれています。">🧬 ワークフローあり</span>';
          }
        }
      });
    });

    checkAllCivitaiCreatorsUnread();

  } catch (err) {
    console.error("Civitai gallery fetch error:", err);
    civitaiGalleryList.innerHTML = `<span class="item-meta error" style="padding: 18px; color: var(--danger);">Civitai ギャラリーの取得に失敗しました: ${escapeHtml(err.message)}</span>`;
  }
}

// --- 設定の読み込みと初期化 ---
function loadSettings() {
  const savedAccount   = localStorage.getItem("r2AccountId") || "";
  const savedBucket    = localStorage.getItem("r2BucketName") || "";
  const savedKeyId     = localStorage.getItem("r2AccessKeyId") || "";
  const savedSecret    = localStorage.getItem("r2SecretAccessKey") || "";
  const savedPublic    = localStorage.getItem("r2PublicDomain") || "";
  const savedDev       = localStorage.getItem("r2DevDomain") || "";

  if (r2AccountId) r2AccountId.value = savedAccount;
  if (r2BucketName) r2BucketName.value = savedBucket;
  if (r2AccessKeyId) r2AccessKeyId.value = savedKeyId;
  if (r2SecretAccessKey) r2SecretAccessKey.value = savedSecret;

  renderR2DomainSelect();
  updateR2Status();
  renderCivitaiUserSelect();
  updateCivitaiStatus();

  const savedEnableConvert = localStorage.getItem("enableConvert");
  if (savedEnableConvert !== null && enableConvertCheck) {
    enableConvertCheck.checked = savedEnableConvert === "true";
  }
  if (convertSettingsArea && enableConvertCheck) {
    convertSettingsArea.classList.toggle("is-disabled-area", !enableConvertCheck.checked);
  }

  const savedEnableRename = localStorage.getItem("enableRename");
  if (savedEnableRename !== null && enableRenameCheck) {
    enableRenameCheck.checked = savedEnableRename === "true";
  }
  if (renameSettingsArea && enableRenameCheck) {
    renameSettingsArea.classList.toggle("is-disabled-area", !enableRenameCheck.checked);
  }

  const savedEnableZip = localStorage.getItem("enableZip");
  if (savedEnableZip !== null && enableZipCheck) {
    enableZipCheck.checked = savedEnableZip === "true";
  }

  const savedFormat = localStorage.getItem("formatSelect");
  if (savedFormat && extensions[savedFormat] && formatSelect) {
    formatSelect.value = savedFormat;
  }

  const savedQuality = localStorage.getItem("qualityRange");
  if (savedQuality) {
    if (qualityRange) qualityRange.value = savedQuality;
    if (qualityOutput) qualityOutput.textContent = savedQuality;
  }

  const savedRename = localStorage.getItem("renamePattern");
  if (savedRename && renamePattern) {
    renamePattern.value = savedRename;
  }

  const savedLimit = localStorage.getItem("storageLimit") || "10000";
  if (storageLimitRange) storageLimitRange.value = savedLimit;
  updateLimitOutput(savedLimit);

  const savedAutoCleanup = localStorage.getItem("autoCleanup");
  if (savedAutoCleanup !== null && autoCleanupCheckbox) {
    autoCleanupCheckbox.checked = savedAutoCleanup === "true";
  }

  loadTemplates();
}

function loadTemplates(selectedValue = "") {
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;
  let savedTemplates = {};
  try {
    savedTemplates = JSON.parse(localStorage.getItem("composerTemplates") || "{}");
  } catch (e) {
    savedTemplates = {};
  }
  
  const templates = { ...defaultTemplates, ...savedTemplates };
  if (!templateSelect) return;
  
  templateSelect.innerHTML = `<option value="">${escapeHtml(dict.promptSelect)}</option>`;
  for (const [key, item] of Object.entries(templates)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.dataset.text = item.text;
    opt.textContent = item.name;
    templateSelect.append(opt);
  }

  const optCustom = document.createElement("option");
  optCustom.value = "__new__";
  optCustom.textContent = dict.promptNew;
  templateSelect.append(optCustom);

  if (selectedValue) {
    templateSelect.value = selectedValue;
  }
}

// --- 🔐 PINコードによる暗号化/復号化 ---
function encryptPayloadWithPin(payloadObj, pin) {
  const jsonStr = JSON.stringify(payloadObj);
  let result = "";
  for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i) ^ pin.charCodeAt(i % pin.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(encodeURIComponent(result));
}

function decryptPayloadWithPin(encodedStr, pin) {
  try {
    const raw = decodeURIComponent(atob(encodedStr));
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ pin.charCodeAt(i % pin.length);
      result += String.fromCharCode(charCode);
    }
    return JSON.parse(result);
  } catch {
    return null;
  }
}

function generateRandom6DigitPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// --- 📦 アプリ統合データのエクスポート & インポート (R2 / Civitai / 変換設定) ---

function buildAppExportPayload() {
  const accountId       = (localStorage.getItem("r2AccountId") || r2AccountId?.value || "").trim();
  const bucketName      = (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();
  const accessKeyId     = (localStorage.getItem("r2AccessKeyId") || r2AccessKeyId?.value || "").trim();
  const secretAccessKey = (localStorage.getItem("r2SecretAccessKey") || r2SecretAccessKey?.value || "").trim();
  const publicDomain    = (localStorage.getItem("r2PublicDomain") || r2PublicDomain?.value || "").trim();
  const devDomain       = (localStorage.getItem("r2DevDomain") || r2DevDomain?.value || "").trim();

  const currentCivitaiUser = getCurrentCivitaiUser();
  const civitaiUserList = getCivitaiUserList();
  const domainList = getR2DomainList();
  const selectedDomain = getSelectedR2Domain();

  const payload = { v: 2 };
  if (accountId) payload.a = accountId;
  if (bucketName) payload.b = bucketName;
  if (accessKeyId) payload.k = accessKeyId;
  if (secretAccessKey) payload.s = secretAccessKey;
  if (publicDomain) payload.p = publicDomain;
  if (devDomain) payload.d = devDomain;
  if (domainList.length > 0) payload.dl = domainList;
  if (selectedDomain) payload.ds = selectedDomain;

  if (currentCivitaiUser) payload.cu = currentCivitaiUser;
  if (civitaiUserList.length > 0) payload.cul = civitaiUserList;

  const enableConvert = localStorage.getItem("enableConvert");
  if (enableConvert !== null) payload.conv = (enableConvert === "true");

  return payload;
}

function applyAppImportPayload(payload) {
  if (!payload || typeof payload !== "object") return false;

  let hasRestoredAny = false;

  // 1. R2 接続設定
  if (payload.a && payload.b && payload.k && payload.s) {
    localStorage.setItem("r2AccountId", payload.a);
    localStorage.setItem("r2BucketName", payload.b);
    localStorage.setItem("r2AccessKeyId", payload.k);
    localStorage.setItem("r2SecretAccessKey", payload.s);
    if (payload.p) localStorage.setItem("r2PublicDomain", payload.p);
    if (payload.d) localStorage.setItem("r2DevDomain", payload.d);

    if (r2AccountId) r2AccountId.value = payload.a;
    if (r2BucketName) r2BucketName.value = payload.b;
    if (r2AccessKeyId) r2AccessKeyId.value = payload.k;
    if (r2SecretAccessKey) r2SecretAccessKey.value = payload.s;
    hasRestoredAny = true;
  }

  // 1.1 R2 配信ドメインリスト復元
  if (Array.isArray(payload.dl) && payload.dl.length > 0) {
    saveR2DomainList(payload.dl);
    if (payload.ds) setSelectedR2Domain(payload.ds);
    renderR2DomainSelect();
    hasRestoredAny = true;
  }

  // 2. Civitai 設定
  if (Array.isArray(payload.cul) && payload.cul.length > 0) {
    localStorage.setItem("civitaiUserList", JSON.stringify(payload.cul));
    hasRestoredAny = true;
  }
  if (payload.cu) {
    localStorage.setItem("civitaiUsername", payload.cu);
    hasRestoredAny = true;
  } else if (Array.isArray(payload.cul) && payload.cul.length > 0) {
    localStorage.setItem("civitaiUsername", payload.cul[0]);
    hasRestoredAny = true;
  }

  // 3. 変換設定
  if (payload.conv !== undefined) {
    localStorage.setItem("enableConvert", String(payload.conv));
    if (enableConvertCheck) enableConvertCheck.checked = Boolean(payload.conv);
  }

  // UI へ再反映
  loadSettings();
  renderCivitaiUserSelect();
  fetchAndRenderCivitaiGallery();
  updateR2Status();
  updateCivitaiStatus();

  return hasRestoredAny;
}

// PINコード付き暗号化バックアップURLの発行
async function generatePinBackupUrl() {
  const payload = buildAppExportPayload();
  const hasData = (payload.a && payload.b) || payload.cu || (payload.cul && payload.cul.length > 0);
  if (!hasData) {
    alert("⚠️ バックアップする設定（R2接続情報またはCivitaiクリエイターリスト）がありません。");
    return;
  }

  const autoPin = generateRandom6DigitPin();
  const encrypted = encryptPayloadWithPin(payload, autoPin);
  const backupUrl = `${window.location.origin}${window.location.pathname}#enc=${encrypted}`;

  try {
    await navigator.clipboard.writeText(backupUrl);
  } catch (err) {
    console.error("Clipboard copy error:", err);
  }

  const pinDisplayModal = document.querySelector("#pinDisplayModal");
  const generatedPinText = document.querySelector("#generatedPinText");
  const backupUrlTextarea = document.querySelector("#backupUrlTextarea");

  if (generatedPinText) generatedPinText.textContent = autoPin;
  if (backupUrlTextarea) backupUrlTextarea.value = backupUrl;
  if (pinDisplayModal) pinDisplayModal.style.display = "grid";
}

let pendingEncryptedHash = "";

function checkAndApplyHashSync() {
  try {
    const hash = window.location.hash || "";

    if (hash.startsWith("#enc=")) {
      pendingEncryptedHash = hash.replace("#enc=", "");
      const pinModal = document.querySelector("#pinModal");
      const pinInput = document.querySelector("#pinInput");
      const pinErrorNotice = document.querySelector("#pinErrorNotice");
      if (pinInput) pinInput.value = "";
      if (pinErrorNotice) pinErrorNotice.textContent = "";
      if (pinModal) pinModal.style.display = "grid";
      return;
    }

    if (hash.startsWith("#sync=")) {
      const encoded = hash.substring(6);
      if (encoded) {
        const jsonStr = decodeURIComponent(atob(encoded));
        const payload = JSON.parse(jsonStr);

        if (applyAppImportPayload(payload)) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    }
  } catch (err) {
    console.error("Failed to parse sync hash:", err);
  }
}

// 起動時の初期ロード & ハッシュ同期チェック
checkAndApplyHashSync();
loadSettings();
setAppLanguage(getAppLanguage());
if (updateR2Status()) {
  fetchAndRenderR2Files();
}
fetchAndRenderCivitaiGallery();

// --- イベントリスナー: R2 設定自動保存 ---
let r2AutoFetchTimer = null;

const saveR2SettingsAuto = () => {
  let rawAccount = r2AccountId?.value?.trim() || "";
  // S3 API URL（https://<account_id>.r2.cloudflarestorage.com）が貼られた場合は自動抽出
  if (rawAccount.includes(".r2.cloudflarestorage.com")) {
    const match = rawAccount.match(/https?:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/i);
    if (match && match[1]) {
      rawAccount = match[1];
      if (r2AccountId) r2AccountId.value = rawAccount;
    }
  }

  const accountId = rawAccount;
  const bucketName = r2BucketName?.value?.trim() || "";
  const accessKeyId = r2AccessKeyId?.value?.trim() || "";
  const secretAccessKey = r2SecretAccessKey?.value?.trim() || "";
  const publicDomain = r2PublicDomain?.value?.trim() || "";
  const devDomain = r2DevDomain?.value?.trim() || "";

  if (accountId) localStorage.setItem("r2AccountId", accountId);
  if (bucketName) localStorage.setItem("r2BucketName", bucketName);
  if (accessKeyId) localStorage.setItem("r2AccessKeyId", accessKeyId);
  if (secretAccessKey) localStorage.setItem("r2SecretAccessKey", secretAccessKey);

  const isConfigured = updateR2Status();
  render();

  if (r2AutoFetchTimer) clearTimeout(r2AutoFetchTimer);
  if (isConfigured) {
    r2AutoFetchTimer = setTimeout(() => {
      fetchAndRenderR2Files();
    }, 400);
  }
};

r2AccountId?.addEventListener("input", saveR2SettingsAuto);
r2BucketName?.addEventListener("input", saveR2SettingsAuto);
r2AccessKeyId?.addEventListener("input", saveR2SettingsAuto);
r2SecretAccessKey?.addEventListener("input", saveR2SettingsAuto);

// 🌐 ドメイン選択変更リスナー
r2DomainSelect?.addEventListener("change", (e) => {
  setSelectedR2Domain(e.target.value);
  updateR2Status();
  render();
  fetchAndRenderR2Files();
});

// 🌐 ドメイン追加フォーム表示
r2DomainAddBtn?.addEventListener("click", () => {
  if (r2DomainAddForm) {
    r2DomainAddForm.style.display = "flex";
    if (r2DomainNewInput) {
      r2DomainNewInput.value = "";
      r2DomainNewInput.focus();
    }
  }
});

// 🌐 ドメイン追加フォームキャンセル
r2DomainNewCancelBtn?.addEventListener("click", () => {
  if (r2DomainAddForm) r2DomainAddForm.style.display = "none";
});

// 🌐 ドメイン新規追加処理
function handleAddNewDomain() {
  const raw = r2DomainNewInput?.value?.trim() || "";
  if (!raw) return;

  let formatted = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = "https://" + formatted;
  }

  const list = getR2DomainList();
  if (!list.includes(formatted)) {
    list.push(formatted);
    saveR2DomainList(list);
  }
  setSelectedR2Domain(formatted);
  renderR2DomainSelect();
  updateR2Status();
  render();
  fetchAndRenderR2Files();

  if (r2DomainAddForm) r2DomainAddForm.style.display = "none";
}

r2DomainNewSaveBtn?.addEventListener("click", handleAddNewDomain);
r2DomainNewInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAddNewDomain();
  } else if (e.key === "Escape") {
    if (r2DomainAddForm) r2DomainAddForm.style.display = "none";
  }
});

// 🌐 ドメイン削除リスナー
r2DomainDeleteBtn?.addEventListener("click", () => {
  const current = getSelectedR2Domain();
  if (!current) return;

  if (!confirm(`選択中の配信ドメイン「${current}」を削除しますか？`)) return;

  const list = getR2DomainList();
  const nextList = list.filter(d => d !== current);
  saveR2DomainList(nextList);

  const nextSelected = nextList.length > 0 ? nextList[0] : "";
  setSelectedR2Domain(nextSelected);

  renderR2DomainSelect();
  updateR2Status();
  render();
  fetchAndRenderR2Files();
});

cfSaveButton?.addEventListener("click", () => {
  saveR2SettingsAuto();
  if (cfSettingsAccordion) cfSettingsAccordion.open = false;
  fetchAndRenderR2Files();
});

cfClearButton?.addEventListener("click", () => {
  localStorage.removeItem("r2AccountId");
  localStorage.removeItem("r2BucketName");
  localStorage.removeItem("r2AccessKeyId");
  localStorage.removeItem("r2SecretAccessKey");
  localStorage.removeItem("r2DomainList");
  localStorage.removeItem("r2SelectedDomain");
  localStorage.removeItem("r2PublicDomain");
  localStorage.removeItem("r2DevDomain");

  if (r2AccountId) r2AccountId.value = "";
  if (r2BucketName) r2BucketName.value = "";
  if (r2AccessKeyId) r2AccessKeyId.value = "";
  if (r2SecretAccessKey) r2SecretAccessKey.value = "";

  renderR2DomainSelect();
  updateR2Status();
  render();
  fetchAndRenderR2Files();
  if (cfSettingsAccordion) cfSettingsAccordion.open = true;
});

// --- 📱 可視光スキャン（QRコード）同期ハンドラ ---
async function openSyncQrModal() {
  const payload = buildAppExportPayload();
  const hasData = payload.a || payload.cu || (payload.cul && payload.cul.length > 0);
  if (!hasData) {
    alert("⚠️ 引き継ぐ設定（R2接続設定またはCivitaiクリエイターリスト）がありません。");
    return;
  }

  try {
    const jsonStr = JSON.stringify(payload);
    const encoded = btoa(encodeURIComponent(jsonStr));
    const syncUrl = `${window.location.origin}${window.location.pathname}#sync=${encoded}`;

    if (qrCanvas) {
      await QRCode.toCanvas(qrCanvas, syncUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
    }

    if (qrModal) qrModal.style.display = "grid";
  } catch (err) {
    console.error("QR Code generation error:", err);
    alert("QRコードの生成に失敗しました。");
  }
}

cfShareQrButton?.addEventListener("click", openSyncQrModal);
topbarSyncButton?.addEventListener("click", openSyncQrModal);

globalClearButton?.addEventListener("click", () => {
  if (!confirm("⚠️ アプリに保存された全設定（R2接続情報、Civitaiウォッチリスト、変換設定等）を消去して初期化しますか？")) return;
  localStorage.clear();
  location.reload();
});

cfBackupUrlButton?.addEventListener("click", generatePinBackupUrl);

closeQrModalButton?.addEventListener("click", () => {
  if (qrModal) qrModal.style.display = "none";
});

qrModal?.addEventListener("click", (e) => {
  if (e.target === qrModal) {
    qrModal.style.display = "none";
  }
});

// 🎨 Civitai クリエイター選択・追加・削除・更新イベントリスナー
civitaiUserSelect?.addEventListener("change", () => {
  const selected = civitaiUserSelect.value.trim();
  if (selected) {
    localStorage.setItem("civitaiUsername", selected);
    updateCivitaiStatus();
    fetchAndRenderCivitaiGallery();
  }
});

civitaiUserAddBtn?.addEventListener("click", () => {
  if (!civitaiUserAddForm) return;
  const isOpen = civitaiUserAddForm.style.display === "flex";
  civitaiUserAddForm.style.display = isOpen ? "none" : "flex";
  if (!isOpen && civitaiUserNewInput) {
    civitaiUserNewInput.value = "";
    civitaiUserNewInput.focus();
  }
});

civitaiUserNewCancelBtn?.addEventListener("click", () => {
  if (civitaiUserAddForm) civitaiUserAddForm.style.display = "none";
});

civitaiUserNewSaveBtn?.addEventListener("click", () => {
  const val = civitaiUserNewInput?.value?.trim() || "";
  if (!val) return;

  const list = getCivitaiUserList();
  const exists = list.some(u => u.toLowerCase() === val.toLowerCase());
  if (!exists) {
    list.push(val);
    saveCivitaiUserList(list);
  }

  localStorage.setItem("civitaiUsername", val);
  if (civitaiUserAddForm) civitaiUserAddForm.style.display = "none";
  renderCivitaiUserSelect();
  fetchAndRenderCivitaiGallery();
});

civitaiUserNewInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    civitaiUserNewSaveBtn?.click();
  } else if (e.key === "Escape") {
    civitaiUserNewCancelBtn?.click();
  }
});

civitaiUserDeleteBtn?.addEventListener("click", () => {
  const list = getCivitaiUserList();
  const current = getCurrentCivitaiUser();
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  if (!current) return;

  const confirmMsg = (dict.civitaiDeleteConfirm || "登録クリエイター「{name}」をウォッチリストから削除しますか？").replace("{name}", current);
  if (!confirm(confirmMsg)) return;

  const newList = list.filter(u => u !== current);
  saveCivitaiUserList(newList);

  const lastSeenMap = getCivitaiLastSeenMap();
  delete lastSeenMap[current];
  saveCivitaiLastSeenMap(lastSeenMap);

  if (newList.length > 0) {
    localStorage.setItem("civitaiUsername", newList[0]);
  } else {
    localStorage.removeItem("civitaiUsername");
  }

  renderCivitaiUserSelect();
  fetchAndRenderCivitaiGallery();
});

reloadCivitaiButton?.addEventListener("click", () => {
  fetchAndRenderCivitaiGallery();
});

// PINモーダル処理
const submitPinButton = document.querySelector("#submitPinButton");
const cancelPinButton = document.querySelector("#cancelPinButton");
const pinModal = document.querySelector("#pinModal");
const pinInput = document.querySelector("#pinInput");
const pinErrorNotice = document.querySelector("#pinErrorNotice");
const closePinDisplayModalButton = document.querySelector("#closePinDisplayModalButton");
const pinDisplayModal = document.querySelector("#pinDisplayModal");

submitPinButton?.addEventListener("click", () => {
  const pin = pinInput?.value?.trim() || "";
  if (!pin || pin.length < 6) {
    if (pinErrorNotice) pinErrorNotice.textContent = "6桁のPINコードを入力してください";
    return;
  }

  const payload = decryptPayloadWithPin(pendingEncryptedHash, pin);
  if (!payload || !payload.a || !payload.b || !payload.k || !payload.s) {
    if (pinErrorNotice) pinErrorNotice.textContent = "❌ PINコードが正しくありません";
    return;
  }

  applyAppImportPayload(payload);

  if (pinModal) pinModal.style.display = "none";
  history.replaceState(null, "", window.location.pathname + window.location.search);
  alert("🎉 設定を正常に復元・保存しました！");
});

cancelPinButton?.addEventListener("click", () => {
  if (pinModal) pinModal.style.display = "none";
  history.replaceState(null, "", window.location.pathname + window.location.search);
});

closePinDisplayModalButton?.addEventListener("click", () => {
  if (pinDisplayModal) pinDisplayModal.style.display = "none";
});

// --- UI イベントリスナー ---
enableConvertCheck?.addEventListener("change", () => {
  const isChecked = enableConvertCheck.checked;
  localStorage.setItem("enableConvert", String(isChecked));
  if (convertSettingsArea) {
    convertSettingsArea.classList.toggle("is-disabled-area", !isChecked);
  }
  render();
  updateRenamePreview();
});

enableRenameCheck?.addEventListener("change", () => {
  const isChecked = enableRenameCheck.checked;
  localStorage.setItem("enableRename", String(isChecked));
  if (renameSettingsArea) {
    renameSettingsArea.classList.toggle("is-disabled-area", !isChecked);
  }
  render();
  updateRenamePreview();
});

enableZipCheck?.addEventListener("change", () => {
  const isChecked = enableZipCheck.checked;
  localStorage.setItem("enableZip", String(isChecked));
  render();
});

qualityRange?.addEventListener("input", () => {
  if (qualityOutput) qualityOutput.textContent = qualityRange.value;
  localStorage.setItem("qualityRange", qualityRange.value);
});

formatSelect?.addEventListener("change", () => {
  localStorage.setItem("formatSelect", formatSelect.value);
  updateRenamePreview();
});

renamePattern?.addEventListener("input", () => {
  localStorage.setItem("renamePattern", renamePattern.value.trim());
  updateRenamePreview();
});

clearRenamePattern?.addEventListener("click", () => {
  if (renamePattern) {
    renamePattern.value = "";
    renamePattern.focus();
    localStorage.setItem("renamePattern", "");
    updateRenamePreview();
  }
});

document.querySelector(".pattern-helpers")?.addEventListener("click", (event) => {
  const target = event.target;
  if (target.classList.contains("tag-button")) {
    const insertText = target.dataset.insert;
    if (!insertText || !renamePattern) return;

    const start = renamePattern.selectionStart ?? renamePattern.value.length;
    const end = renamePattern.selectionEnd ?? renamePattern.value.length;
    const text = renamePattern.value;

    const newText = text.substring(0, start) + insertText + text.substring(end);
    renamePattern.value = newText;

    renamePattern.focus();
    const newPos = start + insertText.length;
    renamePattern.setSelectionRange(newPos, newPos);

    localStorage.setItem("renamePattern", renamePattern.value.trim());
    updateRenamePreview();
  }
});

storageLimitRange?.addEventListener("input", () => {
  const val = storageLimitRange.value;
  updateLimitOutput(val);
  localStorage.setItem("storageLimit", val);
  updateStorageUsageUI();
});

autoCleanupCheckbox?.addEventListener("change", () => {
  localStorage.setItem("autoCleanup", String(autoCleanupCheckbox.checked));
});

function updateLimitOutput(value) {
  if (!storageLimitOutput) return;
  const mb = Number(value);
  if (mb >= 1000) {
    storageLimitOutput.textContent = `${(mb / 1000).toFixed(1)} GB`;
  } else {
    storageLimitOutput.textContent = `${mb} MB`;
  }
}

function updateStorageUsageUI() {
  if (!storageLimitRange || !storageUsageText || !storageUsageBar) return;
  const totalSize = state.r2TotalSize || 0;
  const limitMb = Number(storageLimitRange.value) || 10000;
  const limitBytes = limitMb * 1024 * 1024;
  
  const percentage = limitBytes > 0 ? (totalSize / limitBytes) * 100 : 0;
  const clampedPercentage = Math.min(100, Math.round(percentage * 10) / 10);
  
  if (storageUsageBar) storageUsageBar.value = clampedPercentage;
  
  if (storageUsageText) {
    const formattedLimit = limitMb >= 1000 ? `${(limitMb / 1000).toFixed(1)} GB` : `${limitMb} MB`;
    storageUsageText.textContent = `使用量: ${formatBytes(totalSize)} / ${formattedLimit} (${clampedPercentage}%)`;
    
    if (totalSize > limitBytes) {
      storageUsageText.classList.add("storage-warning");
    } else {
      storageUsageText.classList.remove("storage-warning");
    }
  }
}

// ファイル選択関連
fileInput?.addEventListener("change", () => {
  const files = Array.from(fileInput.files || []).map(f => {
    f.relativePath = f.name;
    return f;
  });
  addFiles(files);
  fileInput.value = "";
});

folderSelectButton?.addEventListener("click", () => {
  folderInput?.click();
});

folderInput?.addEventListener("change", () => {
  const files = Array.from(folderInput.files || []).map(f => {
    f.relativePath = f.webkitRelativePath || f.name;
    return f;
  });
  addFiles(files);
  folderInput.value = "";
});

// ドラッグ＆ドロップ関連
dropzone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});

dropzone?.addEventListener("dragleave", () => {
  dropzone.classList.remove("is-dragging");
});

dropzone?.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragging");

  const items = event.dataTransfer.items;
  if (items) {
    const files = [];
    const scanPromises = [];

    const scanFiles = async (entry, path = "") => {
      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        file.relativePath = path ? `${path}/${file.name}` : file.name;
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const readAllEntries = async () => {
          const entries = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
          if (entries.length > 0) {
            const nextPath = path ? `${path}/${entry.name}` : entry.name;
            for (const nextEntry of entries) {
              await scanFiles(nextEntry, nextPath);
            }
            await readAllEntries();
          }
        };
        await readAllEntries();
      }
    };

    for (const item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        scanPromises.push(scanFiles(entry));
      }
    }

    await Promise.all(scanPromises);
    addFiles(files);
  } else {
    const fallbackFiles = Array.from(event.dataTransfer.files || []).map(f => {
      f.relativePath = f.name;
      return f;
    });
    addFiles(fallbackFiles);
  }
});

clearButton?.addEventListener("click", () => {
  state.results.forEach((result) => {
    if (result && result.url) URL.revokeObjectURL(result.url);
  });
  state.files = [];
  state.results = [];
  render();
});


// --- ComfyUI ワークフロー / 生成メタデータ検出ユーティリティ ---
async function detectComfyMetadata(file) {
  if (!file) return { hasWorkflow: false, hasPrompt: false, hasA1111: false, type: "none" };

  const fileName = (file.name || "").toLowerCase();
  const isPng = fileName.endsWith(".png") || file.type === "image/png";
  const isMp4 = fileName.endsWith(".mp4") || file.type === "video/mp4";
  const isWebm = fileName.endsWith(".webm") || file.type === "video/webm";

  try {
    const headSize = Math.min(file.size, 4 * 1024 * 1024);
    const headBuffer = await file.slice(0, headSize).arrayBuffer();

    if (isPng) {
      const view = new DataView(headBuffer);
      if (view.getUint32(0) === 0x89504e47 && view.getUint32(4) === 0x0d0a1a0a) {
        let offset = 8;
        const length = headBuffer.byteLength;
        let hasWorkflow = false;
        let hasPrompt = false;
        let hasA1111 = false;
        let nodeCount = 0;

        while (offset < length - 8) {
          const chunkLength = view.getUint32(offset);
          offset += 4;
          const chunkType = String.fromCharCode(
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3)
          );
          offset += 4;

          if (chunkType === "IEND") break;

          if (chunkType === "tEXt" || chunkType === "iTXt") {
            const chunkData = new Uint8Array(headBuffer, offset, chunkLength);
            let nullIndex = -1;
            for (let i = 0; i < chunkData.length; i++) {
              if (chunkData[i] === 0) { nullIndex = i; break; }
            }
            if (nullIndex > 0) {
              const keyword = new TextDecoder("utf-8").decode(chunkData.subarray(0, nullIndex));
              if (keyword === "workflow") {
                hasWorkflow = true;
                try {
                  const text = new TextDecoder("utf-8").decode(chunkData.subarray(nullIndex + 1));
                  const wfJson = JSON.parse(text);
                  if (Array.isArray(wfJson.nodes)) nodeCount = wfJson.nodes.length;
                } catch (e) {}
              } else if (keyword === "prompt") {
                hasPrompt = true;
              } else if (keyword === "parameters") {
                hasA1111 = true;
              }
            }
          }

          offset += chunkLength + 4;
        }

        if (hasWorkflow) return { hasWorkflow: true, hasPrompt, hasA1111, nodeCount, type: "comfy_workflow" };
        if (hasPrompt) return { hasWorkflow: false, hasPrompt: true, hasA1111, type: "comfy_prompt" };
        if (hasA1111) return { hasWorkflow: false, hasPrompt: false, hasA1111: true, type: "a1111" };
      }
    }

    let textSample = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(headBuffer));

    if ((isMp4 || isWebm) && file.size > headSize) {
      const tailSize = Math.min(file.size, 3 * 1024 * 1024);
      const tailBuffer = await file.slice(file.size - tailSize).arrayBuffer();
      const tailText = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(tailBuffer));
      textSample = textSample + "\n" + tailText;
    }

    const hasWf = (textSample.includes('"nodes"') && textSample.includes('"links"')) ||
                  (textSample.includes('"workflow"') && textSample.includes('"nodes"'));
    const hasPrompt = (textSample.includes('"inputs"') && textSample.includes('"class_type"')) ||
                      textSample.includes('"client_id"') || textSample.includes('"extra_pnginfo"');

    if (hasWf) return { hasWorkflow: true, hasPrompt, hasA1111: false, type: "comfy_workflow" };
    if (hasPrompt) return { hasWorkflow: false, hasPrompt: true, hasA1111: false, type: "comfy_prompt" };
    if (textSample.includes("Negative prompt:") || textSample.includes("Steps: ")) {
      return { hasWorkflow: false, hasPrompt: false, hasA1111: true, type: "a1111" };
    }

  } catch (err) {
    console.warn("Metadata detection error:", err);
  }

  return { hasWorkflow: false, hasPrompt: false, hasA1111: false, type: "none" };
}

function createComfyBadgeHtml(file, result) {
  const meta = file.metaStatus;
  if (!meta) return '<div style="font-size: 10px; color: var(--muted); margin-top: 3px;">🔍 メタデータ解析中...</div>';

  const isConvertOn = enableConvertCheck?.checked ?? true;
  let badge = "";
  if (meta.hasWorkflow) {
    badge = `
      <span class="meta-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" title="ComfyUIのワークフロー（ノード接続・配置情報）が完全な形で含まれています。ComfyUI画面にドロップすると完全再現可能です。">
        <span>🧬 ComfyUI ワークフロー完全内包${meta.nodeCount ? ` (${meta.nodeCount}ノード)` : ""}</span>
      </span>
    `;
  } else if (meta.hasPrompt) {
    badge = `
      <span class="meta-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600;" title="ComfyUIプロンプト/API入力設定が含まれています。">
        📝 ComfyUI プロンプト情報あり
      </span>
    `;
  } else if (meta.hasA1111) {
    badge = `
      <span class="meta-badge" style="background: rgba(139, 92, 246, 0.15); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.4); font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600;" title="Stable Diffusion WebUI (A1111) 生成パラメータが含まれています。">
        🎨 A1111 生成情報あり
      </span>
    `;
  }

  const fileExt = (file.name || "").split('.').pop().toLowerCase();
  const isVideo = ["mp4", "webm", "mov"].includes(fileExt) || file.type?.startsWith("video/");
  let statusNotice = "";
  if (meta.hasWorkflow || meta.hasPrompt) {
    if (isConvertOn && !isVideo) {
      statusNotice = '<span style="font-size: 10px; color: #f87171; margin-left: 4px;" title="画像を変換（再エンコード）するとブラウザの仕様によりワークフローは削除されます。保持したい場合は『画像を変換する』をOFFにしてください。">⚠️ 変換ONのためExif/WFは削除されます</span>';
    } else {
      statusNotice = '<span style="font-size: 10px; color: #34d399; margin-left: 4px;">🛡️ ワークフロー保持のまま保存/共有されます</span>';
    }
  }

  if (!badge && !statusNotice) return "";

  return `
    <div class="comfy-meta-row" style="margin-top: 4px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
      ${badge}
      ${statusNotice}
    </div>
  `;
}

async function checkRemoteFileWf(key, publicUrl) {
  if (!key || !publicUrl) return false;
  const ext = key.split('.').pop().toLowerCase();
  if (!["png", "webp", "mp4", "webm"].includes(ext)) return false;

  let wfStore = {};
  try {
    wfStore = JSON.parse(localStorage.getItem("comfyWfMap") || "{}");
  } catch (e) {}

  if (wfStore[key] !== undefined) return wfStore[key];

  try {
    const res = await fetch(publicUrl, { headers: { Range: "bytes=0-131072" } });
    if (res.ok || res.status === 206) {
      const buf = await res.arrayBuffer();
      const text = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buf));
      const hasWf = (text.includes('"nodes"') && text.includes('"links"')) ||
                    (text.includes('"inputs"') && text.includes('"class_type"')) ||
                    text.includes('"workflow"');
      wfStore[key] = hasWf;
      localStorage.setItem("comfyWfMap", JSON.stringify(wfStore));
      return hasWf;
    }
  } catch (err) {
    console.debug("Remote WF check skipped:", err);
  }
  return false;
}

function addFiles(files) {
  const allowed = files.filter((file) => {
    return file.type.startsWith("image/") || 
           file.type.startsWith("audio/") || 
           file.type.startsWith("video/") ||
           file.name.endsWith(".mp3") ||
           file.name.endsWith(".mp4");
  });
  state.files.push(...allowed);

  // 🧬 ファイル追加時に非同期で ComfyUI メタデータを自動解析
  allowed.forEach(f => {
    detectComfyMetadata(f).then(meta => {
      f.metaStatus = meta;
      render();
    });
  });

  render();
}

function setUiLock(locked) {
  const r2Ok = updateR2Status();
  const hasFiles = state.files.length > 0;
  const isConvertOn = enableConvertCheck?.checked ?? true;
  const isRenameOn = enableRenameCheck?.checked ?? true;
  const isZipOn = enableZipCheck?.checked ?? false;
  const canProcessLocal = isConvertOn || isRenameOn || isZipOn;

  if (fileInput) fileInput.disabled = locked;
  if (dropzone) dropzone.classList.toggle("is-disabled", locked);
  if (clearButton) clearButton.disabled = locked;
  if (convertDownloadButton) {
    convertDownloadButton.disabled = locked || !hasFiles || !canProcessLocal;
    convertDownloadButton.title = (!canProcessLocal && hasFiles)
      ? "画像変換・リネーム・ZIPまとめ保存がすべてオフのためダウンロード無効"
      : "";
  }
  if (convertUploadButton) convertUploadButton.disabled = locked || !hasFiles || !r2Ok;
}

function updateRenamePreview() {
  const previewText = document.querySelector("#renamePreviewText");
  if (!previewText) return;

  const firstFile = state.files[0];
  const firstExt = firstFile ? (firstFile.name.split('.').pop() || "") : "";
  const isFirstImage = firstFile
    ? (firstFile.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"].includes(firstExt.toLowerCase()))
    : true;

  const isRenameOn = enableRenameCheck?.checked ?? true;
  const isConvertOn = enableConvertCheck?.checked ?? true;

  // 画像以外（MP3等）なら変換設定に関わらず元拡張子を維持
  const ext = (isConvertOn && isFirstImage)
    ? (extensions[formatSelect?.value || "image/webp"] || "webp")
    : (firstExt || "ext");

  const dummyName = firstFile ? firstFile.name.replace(/\.[^.]+$/, "") : "sample";

  if (!isRenameOn) {
    previewText.textContent = `${dummyName}.${ext}`;
    return;
  }

  const rawPattern = renamePattern?.value;
  const pattern = (rawPattern !== undefined && rawPattern !== "") ? rawPattern : "{name}";
  
  let previewName = pattern.replaceAll("{name}", dummyName);

  previewName = previewName.replace(/\{rand[ao]m(?::(\d+))?\}/g, (match, digits) => {
    const len = digits ? parseInt(digits, 10) : 6;
    return "a8Kx21".slice(0, Math.min(len, 6)).padEnd(len, "x");
  });

  previewName = previewName.replace(/\{num(?::(\d+))?\}/g, (match, digits) => {
    const targetLength = digits ? parseInt(digits, 10) : 1;
    return "1".padStart(targetLength, "0");
  });

  previewName = previewName.replace(/[\\/:*?"<>|]/g, "-");
  previewText.textContent = `${previewName}.${ext}`;
}

// --- インプレース描画 (Unified File Card) ---
function render() {
  const r2Ok = updateR2Status();
  const hasFiles = state.files.length > 0;
  if (fileCount) fileCount.textContent = `${state.files.length}件`;

  const isConvertOn = enableConvertCheck?.checked ?? true;
  const isRenameOn = enableRenameCheck?.checked ?? true;
  const isZipOn = enableZipCheck?.checked ?? false;
  const canProcessLocal = isConvertOn || isRenameOn || isZipOn;

  if (convertDownloadButton) {
    convertDownloadButton.disabled = !hasFiles || !canProcessLocal;
    convertDownloadButton.title = (!canProcessLocal && hasFiles)
      ? "画像変換・リネーム・ZIPまとめ保存がすべてオフのためダウンロード無効"
      : "";
  }
  if (convertUploadButton) convertUploadButton.disabled = !hasFiles || !r2Ok;

  if (dropzone) {
    dropzone.classList.toggle("has-files", hasFiles);
  }

  updateRenamePreview();

  if (fileList) {
    fileList.innerHTML = "";
    const lang = getAppLanguage();
    const dict = i18nDict[lang] || i18nDict.ja;

    state.files.forEach((file, index) => {
      const result = state.results[index];
      const item = document.createElement("article");
      item.className = "file-item unified-file-card";
      if (result) item.dataset.id = result.id;
      
      let thumbHtml = "";
      const currentName = result ? result.name : file.name;
      const ext = currentName.split('.').pop().toLowerCase();
      const isVideo = (file.type && file.type.startsWith("video/")) || ["mp4", "webm", "ogv", "mov", "m4v"].includes(ext);

      if (result && result.previewUrl) {
        thumbHtml = `<img class="thumb" alt="" src="${result.previewUrl}">`;
      } else if (file.type.startsWith("image/")) {
        thumbHtml = `<img class="thumb" alt="" src="${URL.createObjectURL(file)}">`;
      } else if (isVideo) {
        const videoSrc = result && result.proxyUrl ? result.proxyUrl : URL.createObjectURL(file);
        thumbHtml = `<video class="thumb" src="${videoSrc}#t=0.5" preload="metadata" muted playsinline style="object-fit: cover; pointer-events: none;"></video>`;
      } else {
        thumbHtml = `<div class="thumb format-badge">${escapeHtml(ext.toUpperCase())}</div>`;
      }

      let metaHtml = "";

      if (result) {
        const saved = result.originalSize - result.size;
        const savedRate = result.originalSize ? Math.round((saved / result.originalSize) * 100) : 0;

        if (result.isNonImage) {
          metaHtml = `${formatBytes(result.size)} · ${escapeHtml(dict.nonConverted)}`;
        } else {
          let rateText = "";
          if (savedRate > 0) {
            const template = dict.rateReduced || "{rate}% 削減";
            rateText = `<span style="color: #4caf50; font-weight: bold;">${escapeHtml(template.replace("{rate}", String(savedRate)))}</span>`;
          } else if (savedRate < 0) {
            const absRate = Math.abs(savedRate);
            const template = dict.rateIncreased || "{rate}% 増加";
            rateText = `<span style="color: #ff5252; font-weight: bold;">${escapeHtml(template.replace("{rate}", String(absRate)))}</span>`;
          } else {
            rateText = `<span style="color: var(--muted);">${escapeHtml(dict.rateUnchanged || "0% 変化なし")}</span>`;
          }
          metaHtml = `${formatBytes(result.originalSize)} ➔ <strong style="color: #fff;">${formatBytes(result.size)}</strong> (${rateText})`;
        }
      } else {
        metaHtml = `${formatBytes(file.size)} · <span style="color: var(--muted);">待機中</span>`;
      }

      const targetUrl = result ? (result.isUploaded && result.proxyUrl ? result.proxyUrl : result.url) : null;
      const thumbWrapper = targetUrl
        ? `<a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer" class="thumb-link" title="表示">${thumbHtml}</a>`
        : thumbHtml;

      item.innerHTML = `
        ${thumbWrapper}
        <div class="item-info-col" style="flex: 1; min-width: 0;">
          <div class="item-name" style="font-weight: 600; font-size: 13px;">${escapeHtml(currentName)}</div>
          <div class="item-meta" style="font-size: 11px; margin-top: 2px;">${metaHtml}</div>
          ${createComfyBadgeHtml(file, result)}
        </div>
        <div class="item-actions-col" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          ${createCardActionHtml(file, result, index)}
          <button type="button" class="ghost-button delete-button danger-button" data-index="${index}" aria-label="削除" title="一覧から削除" style="min-width: 28px; height: 28px; padding: 0 6px; font-size: 14px; line-height: 1;">&times;</button>
        </div>
      `;
      fileList.append(item);
    });
  }
}

function createCardActionHtml(file, result, index) {
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  const isConvertOn = enableConvertCheck?.checked ?? true;
  const isRenameOn = enableRenameCheck?.checked ?? true;
  const canProcessLocal = isConvertOn || isRenameOn;
  const r2Ok = updateR2Status();

  const dlBtnDisabled = (!canProcessLocal && !result) ? "disabled" : "";
  const dlBtnTitle = (!canProcessLocal && !result)
    ? "変換・リネームが両方オフのためダウンロード無効"
    : "ダウンロード";

  const upBtnDisabled = !r2Ok ? "disabled" : "";
  const upBtnTitle = !r2Ok
    ? "R2接続設定が未完了のためアップロード不可"
    : "このファイルだけ変換してR2へアップロード";

  const upBtnStyle = r2Ok
    ? "font-size: 11px; padding: 0 8px; height: 28px;"
    : "opacity: 0.35; font-size: 11px; padding: 0 8px; height: 28px; cursor: not-allowed;";

  if (result && result.isUploading) {
    return `<span class="status-text saving" style="font-size: 11px;">アップロード中...</span>`;
  }

  if (result && result.isUploaded) {
    return `
      <input type="text" class="url-output" value="${escapeHtml(result.proxyUrl)}" readonly style="width: 150px; font-size: 11px; height: 28px; padding: 0 6px;">
      <button type="button" class="ghost-button copy-button" style="font-size: 11px; padding: 0 8px; height: 28px;">${escapeHtml(dict.copyUrl)}</button>
      <button type="button" class="ghost-button download-single-btn" data-index="${index}" style="font-size: 11px; padding: 0 8px; height: 28px;" title="${dlBtnTitle}" ${dlBtnDisabled}>📥 DL</button>
    `;
  }

  // 待機中または変換完了時
  return `
    <button type="button" class="ghost-button download-single-btn" data-index="${index}" style="font-size: 11px; padding: 0 8px; height: 28px;" title="${dlBtnTitle}" ${dlBtnDisabled}>📥 DL</button>
    <button type="button" class="ghost-button upload-single-btn" data-index="${index}" style="${upBtnStyle}" title="${upBtnTitle}" ${upBtnDisabled}>☁️ UP</button>
  `;
}

// ファイルリストイベント委譲
fileList?.addEventListener("click", async (event) => {
  const target = event.target;
  const card = target.closest(".unified-file-card");
  if (!card) return;

  const index = Number(target.dataset.index);

  // 1. 削除ボタン
  if (target.classList.contains("delete-button")) {
    if (!isNaN(index) && index >= 0 && index < state.files.length) {
      const removedResult = state.results[index];
      if (removedResult) {
        if (removedResult.url) URL.revokeObjectURL(removedResult.url);
        if (removedResult.previewUrl) URL.revokeObjectURL(removedResult.previewUrl);
      }
      state.files.splice(index, 1);
      state.results.splice(index, 1);
      render();
    }
    return;
  }

  // 2. 単体ダウンロード
  if (target.classList.contains("download-single-btn")) {
    if (isNaN(index) || index < 0 || index >= state.files.length) return;
    const file = state.files[index];
    let result = state.results[index];

    target.disabled = true;
    target.textContent = "...";
    try {
      if (!result || !isConversionCacheValid()) {
        if (result && result.url) URL.revokeObjectURL(result.url);
        if (result && result.previewUrl) URL.revokeObjectURL(result.previewUrl);
        result = await convertImage(file, index);
        state.results[index] = result;
      }
      downloadUrl(result.url, result.name);
    } catch (e) {
      console.error(e);
      alert("ダウンロードに失敗しました: " + e.message);
    } finally {
      target.disabled = false;
      target.textContent = "📥 DL";
      render();
    }
    return;
  }

  // 3. 単体アップロード
  if (target.classList.contains("upload-single-btn")) {
    if (isNaN(index) || index < 0 || index >= state.files.length) return;
    const file = state.files[index];
    let result = state.results[index];

    target.disabled = true;
    target.textContent = "UP中...";
    try {
      if (!result || !isConversionCacheValid()) {
        if (result && result.url) URL.revokeObjectURL(result.url);
        if (result && result.previewUrl) URL.revokeObjectURL(result.previewUrl);
        result = await convertImage(file, index);
        state.results[index] = result;
      }
      const success = await uploadImage(result);
      if (success) {
        await fetchAndRenderR2Files();
      }
    } catch (e) {
      console.error(e);
      alert("アップロードに失敗しました: " + e.message);
    } finally {
      render();
    }
    return;
  }

  // 4. URL コピー
  if (target.classList.contains("copy-button")) {
    const result = state.results[index];
    const inputUrl = card.querySelector(".url-output")?.value;
    const urlToCopy = result?.proxyUrl || inputUrl;
    await copyToClipboard(urlToCopy, target);
    return;
  }
});

// --- 設定シグネチャ & スマートバイパス ---

let lastConvertedSignature = null;

function getCurrentConfigSignature() {
  const isConvertOn = enableConvertCheck?.checked ?? true;
  const format = formatSelect ? formatSelect.value : "image/webp";
  const quality = qualityRange ? qualityRange.value : "85";
  const isRenameOn = enableRenameCheck?.checked ?? true;
  const pattern = renamePattern ? renamePattern.value : "";
  const fileSig = state.files.map(f => `${f.name}:${f.size}:${f.lastModified}`).join("|");

  return `${isConvertOn}_${format}_${quality}_${isRenameOn}_${pattern}_${fileSig}`;
}

function isConversionCacheValid() {
  if (!state.files.length) return false;
  if (!state.results || state.results.length !== state.files.length) return false;
  if (state.results.some(r => !r || !r.blob)) return false;
  return lastConvertedSignature === getCurrentConfigSignature();
}

function invalidateConversionCache(clearResults = true) {
  lastConvertedSignature = null;
  if (clearResults && state.results.length > 0) {
    state.results.forEach(result => {
      if (result) {
        if (result.url) URL.revokeObjectURL(result.url);
        if (result.previewUrl) URL.revokeObjectURL(result.previewUrl);
      }
    });
    state.results = [];
    render();
  }
}

// --- 画像変換処理 ---
async function runConversion(force = false) {
  if (!state.files.length) return false;

  // 設定が変わっておらず、すでに変換済みBlobが揃っている場合は完全バイパス！
  if (!force && isConversionCacheValid()) {
    return true;
  }

  if (progressBar) progressBar.value = 0;
  if (statusText) {
    statusText.textContent = "変換中...";
    statusText.className = "status-text saving";
  }

  state.results.forEach((result) => {
    if (result) {
      if (result.url) URL.revokeObjectURL(result.url);
      if (result.previewUrl) URL.revokeObjectURL(result.previewUrl);
    }
  });
  state.results = [];
  render();
  setUiLock(true);

  try {
    state.results = new Array(state.files.length).fill(null);

    const conversionPromises = state.files.map((file, index) =>
      convertImage(file, index).then(result => {
        state.results[index] = result;
        const finishedCount = state.results.filter(r => r !== null).length;
        if (progressBar) progressBar.value = Math.round((finishedCount / state.files.length) * 100);
        render();
      })
    );
    await Promise.all(conversionPromises);
    lastConvertedSignature = getCurrentConfigSignature();
    if (statusText) {
      statusText.textContent = "変換完了";
      statusText.className = "status-text";
    }
    return true;
  } catch (error) {
    console.error("Conversion error:", error);
    lastConvertedSignature = null;
    if (statusText) {
      statusText.textContent = "変換失敗";
      statusText.className = "status-text error";
    }
    return false;
  } finally {
    setUiLock(false);
    render();
  }
}

async function convertImage(file, index = 0) {
  const dotIndex = file.name.lastIndexOf(".");
  const fileExt = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : "";
  const isImageMime = file.type && file.type.startsWith("image/");
  const isImageExt = ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "jxl"].includes(fileExt);
  const isImage = isImageMime || isImageExt;

  const isConvertOn = enableConvertCheck?.checked ?? true;

  if (!isImage || !isConvertOn) {
    const url = URL.createObjectURL(file);
    const outputName = createOutputName(file.name, null, index);
    return {
      id: crypto.randomUUID(),
      name: outputName,
      relativePath: file.relativePath || file.name,
      url,
      previewUrl: isImage ? url : "",
      blob: file,
      size: file.size,
      originalSize: file.size,
      isNonImage: !isImage,
    };
  }

  const options = {
    mimeType: formatSelect ? formatSelect.value : "image/webp",
    quality: qualityRange ? Number(qualityRange.value) / 100 : 0.85,
    name: createOutputName(file.name, formatSelect ? formatSelect.value : "image/webp", index),
  };

  let finalBlob = null;

  try {
    const image = await loadImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d", { alpha: true });
    context.drawImage(image, 0, 0);

    finalBlob = await canvasToBlob(canvas, options.mimeType, options.quality);
  } catch (err) {
    console.warn("Canvas conversion fallback failed, using original blob:", err);
    finalBlob = file;
  }

  const finalUrl = URL.createObjectURL(finalBlob);

  return {
    id: crypto.randomUUID(),
    name: options.name,
    relativePath: file.relativePath || file.name,
    url: finalUrl,
    previewUrl: finalUrl,
    blob: finalBlob,
    size: finalBlob.size,
    originalSize: file.size,
    isNonImage: false,
  };
}

// --- R2 S3 アップロード処理 ---
async function uploadImage(result) {
  if (!result || !result.blob) return false;

  const s3 = getS3Client();
  const bucketName = (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();

  if (!s3 || !bucketName) {
    alert("⚠️ R2 接続設定を完了してください");
    return false;
  }

  result.isUploading = true;
  render();

  try {
    const arrayBuffer = await result.blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const contentType = result.blob.type || "application/octet-stream";

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: result.name,
      Body: bytes,
      ContentType: contentType,
      Metadata: {
        size: String(result.size || bytes.length),
      },
    });

    await s3.send(command);

    result.isUploaded = true;
    result.proxyUrl = getPublicUrl(result.name);
    result.storageKey = result.name;

    paletteFiles.unshift({ key: result.name, url: result.proxyUrl });
    renderUrlPalette();

    return true;
  } catch (error) {
    result.error = error.message;
    console.error("R2 Upload failed:", error);
    alert(`アップロード失敗: ${error.message}`);
    return false;
  } finally {
    result.isUploading = false;
    render();
  }
}

// --- ボタンイベント ---
convertUploadButton?.addEventListener("click", async () => {
  if (!state.files.length) return;
  const success = await runConversion();
  if (!success) return;

  const targets = state.results.filter(r => r && !r.isUploaded && !r.isUploading);
  if (targets.length === 0) return;

  setUiLock(true);
  if (statusText) {
    statusText.className = "status-text saving";
    statusText.textContent = `アップロード中 (0/${targets.length})`;
  }
  if (progressBar) progressBar.value = 0;

  try {
    for (let i = 0; i < targets.length; i++) {
      const result = targets[i];
      if (statusText) statusText.textContent = `アップロード中 (${i + 1}/${targets.length})`;
      await uploadImage(result);
      if (progressBar) progressBar.value = Math.round(((i + 1) / targets.length) * 100);
    }
    if (statusText) {
      statusText.textContent = "一括アップロード完了";
      statusText.className = "status-text";
    }
  } catch (error) {
    console.error("Upload failed:", error);
    if (statusText) {
      statusText.textContent = `アップロード失敗: ${error.message}`;
      statusText.className = "status-text error";
    }
  } finally {
    setUiLock(false);
    await fetchAndRenderR2Files();
  }
});

convertDownloadButton?.addEventListener("click", async () => {
  const success = await runConversion();
  if (!success) return;

  const isZipOn = enableZipCheck?.checked ?? false;
  const validResults = state.results.filter(r => r && r.blob);

  if (isZipOn && validResults.length > 0) {
    if (statusText) statusText.textContent = "ZIP作成中...";
    try {
      const zipEntries = [];
      for (const result of validResults) {
        const arrayBuffer = await result.blob.arrayBuffer();
        zipEntries.push({
          name: result.name,
          data: new Uint8Array(arrayBuffer),
        });
      }
      const zipBlob = createZip(zipEntries);
      const zipUrl = URL.createObjectURL(zipBlob);
      downloadUrl(zipUrl, "converted-images.zip");
      setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
      if (statusText) statusText.textContent = "ZIP一括ダウンロード完了";
    } catch (err) {
      console.error("ZIP creation error:", err);
      alert("ZIP作成に失敗しました。個別ダウンロードに切り替えます。");
      for (const result of validResults) {
        if (result && result.url) {
          downloadUrl(result.url, result.name);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  } else {
    if (statusText) statusText.textContent = "ダウンロード中...";
    for (const result of state.results) {
      if (result && result.url) {
        downloadUrl(result.url, result.name);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    if (statusText) statusText.textContent = "ダウンロード完了";
  }
});

// --- R2 ストレージ一覧 & パレット関数 ---
reloadR2FilesButton?.addEventListener("click", fetchAndRenderR2Files);

async function fetchAndRenderR2Files() {
  if (!r2FileList) return;
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;
  const s3 = getS3Client();
  const bucketName = (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();

  if (!s3 || !bucketName) {
    r2FileList.innerHTML = `<span class="item-meta" style="padding: 18px; color: var(--muted); display: block; text-align: center;">${escapeHtml(dict.noFilesR2)}</span>`;
    state.r2TotalSize = 0;
    updateStorageUsageUI();
    return;
  }

  r2FileList.innerHTML = `<span class="status-text saving" style="padding: 18px; display: block;">R2 ファイル一覧を取得中...</span>`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
    });
    const response = await s3.send(command);
    const contents = response.Contents || [];

    // 自動クリーンアップチェック (7日以上経過したファイルを削除)
    const isAutoCleanup = localStorage.getItem("autoCleanup") === "true";
    if (isAutoCleanup && contents.length > 0) {
      const now = new Date();
      const oldKeys = contents.filter(item => {
        if (item.Key?.startsWith("pinned_")) return false; // 📌永続化は保護
        if (!item.LastModified) return false;
        const diffDays = (now - new Date(item.LastModified)) / (1000 * 60 * 60 * 24);
        return diffDays >= 7;
      }).map(item => ({ Key: item.Key }));

      if (oldKeys.length > 0) {
        try {
          const delCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: { Objects: oldKeys },
          });
          await s3.send(delCommand);
        } catch (delErr) {
          console.warn("Auto cleanup delete error:", delErr);
        }
      }
    }

    paletteFiles = contents.map(item => ({
      key: item.Key,
      url: getPublicUrl(item.Key),
    }));
    renderUrlPalette();

    r2FileList.innerHTML = "";
    if (contents.length === 0) {
      r2FileList.innerHTML = `<span class="item-meta" style="padding: 18px; color: var(--muted); display: block; text-align: center;">${escapeHtml(dict.noFilesR2)}</span>`;
      state.r2TotalSize = 0;
      updateStorageUsageUI();
      return;
    }

    // 更新日時の降順ソート
    contents.sort((a, b) => new Date(b.LastModified || 0) - new Date(a.LastModified || 0));

    state.r2TotalSize = contents.reduce((acc, cur) => acc + (cur.Size || 0), 0);
    updateStorageUsageUI();

    contents.forEach(item => {
      const article = document.createElement("article");
      article.className = "result-item";

      const ext = item.Key ? item.Key.split('.').pop().toLowerCase() : "";
      const isVideo = ["mp4", "webm", "ogv", "mov", "m4v"].includes(ext);
      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext);
      const publicUrl = getPublicUrl(item.Key);
      const devUrl = getDevUrl(item.Key);

      let thumbHtml = "";
      if (isImage) {
        thumbHtml = `<img class="thumb" alt="" src="${escapeHtml(publicUrl)}" loading="lazy">`;
      } else if (isVideo) {
        thumbHtml = `<video class="thumb" src="${escapeHtml(publicUrl)}#t=0.5" preload="metadata" muted playsinline style="object-fit: cover; pointer-events: none;"></video>`;
      } else {
        thumbHtml = `<div class="thumb format-badge">${escapeHtml(ext.toUpperCase() || "FILE")}</div>`;
      }

      const dateStr = item.LastModified ? new Date(item.LastModified).toLocaleDateString() : "";

      article.innerHTML = `
        <input type="checkbox" class="r2-file-checkbox" data-key="${escapeHtml(item.Key)}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); align-self: center; margin-right: 4px;">
        <a href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener noreferrer" class="thumb-link" title="表示">
          ${thumbHtml}
        </a>
        <div style="flex: 1; min-width: 0;">
          <div class="item-name-row" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="item-name" style="font-weight: 600; word-break: break-all;">${escapeHtml(item.Key)}</span>
            <span style="color: #64748b; font-size: 11px; white-space: nowrap;">${formatBytes(item.Size || 0)}</span>
            <span class="r2-wf-badge-placeholder" data-key="${escapeHtml(item.Key)}"></span>
          </div>
          <div class="item-meta" style="color: var(--muted); margin-top: 4px; font-size: 11px;">
            更新日: ${escapeHtml(dateStr)}
          </div>
        </div>
        <div class="result-actions" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button type="button" class="ghost-button copy-r2-url-btn" data-url="${escapeHtml(publicUrl)}">${escapeHtml(dict.copyUrl)}</button>
          ${devUrl ? `<button type="button" class="ghost-button copy-r2-dev-url-btn" data-url="${escapeHtml(devUrl)}">${escapeHtml(dict.devCopyUrl)}</button>` : ""}
          <button type="button" class="ghost-button danger-button delete-r2-file-btn" data-key="${escapeHtml(item.Key)}">${escapeHtml(dict.deleteNow)}</button>
        </div>
      `;

      r2FileList.append(article);

      // R2 ファイルのワークフロー有無を非同期で判定し、存在する場合のみバッジを表示
      checkRemoteFileWf(item.Key, publicUrl).then(hasWf => {
        if (hasWf) {
          const placeholder = article.querySelector('.r2-wf-badge-placeholder');
          if (placeholder) {
            placeholder.innerHTML = '<span class="meta-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600;" title="ComfyUIワークフローまたはプロンプトが含まれています。">🧬 ワークフローあり</span>';
          }
        }
      });
    });

    updateSelectedR2ActionButtonsState();
  } catch (error) {
    console.error("R2 fetch error:", error);
    r2FileList.innerHTML = `<span class="item-meta error" style="padding: 18px; color: var(--danger); display: block; text-align: center;">R2 エラー: ${escapeHtml(error.message)}</span>`;
  }
}

// R2 ファイル操作イベント委譲
r2FileList?.addEventListener("click", async (e) => {
  const target = e.target;
  const s3 = getS3Client();
  const bucketName = (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();

  if (target.classList.contains("copy-r2-url-btn")) {
    const url = target.dataset.url;
    await copyToClipboard(url, target);
    return;
  }

  if (target.classList.contains("copy-r2-dev-url-btn")) {
    const url = target.dataset.url;
    await copyToClipboard(url, target);
    return;
  }

  if (target.classList.contains("delete-r2-file-btn")) {
    const key = target.dataset.key;
    if (!key || !confirm(`ファイル '${key}' を R2 から削除しますか？`)) return;

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await s3.send(command);
      await fetchAndRenderR2Files();
    } catch (err) {
      alert(`削除に失敗しました: ${err.message}`);
    }
    return;
  }

  if (target.classList.contains("r2-file-checkbox")) {
    updateSelectedR2ActionButtonsState();
  }
});

function updateSelectedR2ActionButtonsState() {
  const checkboxes = document.querySelectorAll(".r2-file-checkbox:checked");
  if (deleteSelectedR2FilesButton) {
    deleteSelectedR2FilesButton.style.display = checkboxes.length > 0 ? "inline-flex" : "none";
    deleteSelectedR2FilesButton.textContent = `選択削除 (${checkboxes.length})`;
  }
}

deleteSelectedR2FilesButton?.addEventListener("click", async () => {
  const checkboxes = Array.from(document.querySelectorAll(".r2-file-checkbox:checked"));
  if (checkboxes.length === 0) return;

  if (!confirm(`選択した ${checkboxes.length} 件のファイルを R2 から削除しますか？`)) return;

  const s3 = getS3Client();
  const bucketName = (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();
  const objects = checkboxes.map(cb => ({ Key: cb.dataset.key }));

  try {
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: objects },
    });
    await s3.send(command);
    await fetchAndRenderR2Files();
  } catch (err) {
    alert(`一括削除に失敗しました: ${err.message}`);
  }
});

// URL 生成ヘルパー
function getPublicUrl(key) {
  const domain = getSelectedR2Domain();
  return domain ? `${domain.replace(/\/$/, "")}/${encodeURIComponent(key)}` : key;
}

function getDevUrl(key) {
  const list = getR2DomainList();
  const dev = list.find(d => d.includes(".r2.dev"));
  return dev ? `${dev.replace(/\/$/, "")}/${encodeURIComponent(key)}` : getPublicUrl(key);
}

// パレット描画
function renderUrlPalette() {
  if (!paletteList) return;
  paletteList.innerHTML = "";

  const allPaletteFiles = [...paletteFiles, ...civitaiPaletteFiles];

  if (allPaletteFiles.length === 0) {
    paletteList.innerHTML = `<span style="font-size: 11px; color: var(--muted); padding: 8px;">R2 ストレージまたはCivitaiのメディアがありません。</span>`;
    return;
  }

  allPaletteFiles.forEach(file => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = file.isCivitai ? "palette-chip civitai-palette-chip" : "palette-chip";
    btn.dataset.url = file.url;
    btn.title = `${file.key} (クリックでURL挿入)`;
    btn.style.position = "relative";

    const ext = file.key ? file.key.split('.').pop().toLowerCase() : "";
    const isVideo = file.isVideo || ["mp4", "webm", "ogv", "mov", "m4v"].includes(ext);
    const isImage = !isVideo && (file.previewUrl || ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext) || file.isCivitai);

    if (isVideo) {
      const video = document.createElement("video");
      video.src = `${file.url}#t=0.5`;
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("referrerpolicy", "no-referrer");
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.style.pointerEvents = "none";
      btn.append(video);
    } else if (isImage) {
      const img = document.createElement("img");
      img.src = file.previewUrl || file.url;
      img.alt = "";
      img.loading = "lazy";
      img.setAttribute("referrerpolicy", "no-referrer");
      btn.append(img);
    } else {
      btn.className += " format-badge";
      btn.textContent = ext.toUpperCase() || "FILE";
    }

    if (file.isCivitai) {
      const badge = document.createElement("span");
      badge.className = "palette-chip-badge";
      badge.textContent = "🎨";
      btn.append(badge);
    }

    btn.addEventListener("click", () => {
      insertUrlToComposer(file.url);
    });

    paletteList.append(btn);
  });
}

function insertUrlToComposer(url) {
  if (!composerTextarea) return;
  const text = composerTextarea.value;
  if (text.includes("{url}")) {
    const idx = text.indexOf("{url}");
    composerTextarea.value = text.replace("{url}", url);
    const newPos = idx + url.length;
    composerTextarea.focus();
    composerTextarea.setSelectionRange(newPos, newPos);
  } else {
    const start = composerTextarea.selectionStart;
    const end = composerTextarea.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);

    composerTextarea.value = `${before}${url}\n${after}`;
    composerTextarea.focus();
    composerTextarea.selectionStart = composerTextarea.selectionEnd = start + url.length + 1;
  }
}

// テキスト作成支援のイベント
templateSelect?.addEventListener("change", () => {
  const val = templateSelect.value;
  if (!val) {
    if (deleteTemplateButton) deleteTemplateButton.style.display = "none";
    return;
  }

  if (val === "__new__") {
    if (deleteTemplateButton) deleteTemplateButton.style.display = "none";
    return;
  }

  const selectedOpt = templateSelect.selectedOptions[0];
  if (selectedOpt && composerTextarea) {
    composerTextarea.value = selectedOpt.dataset.text || "";
  }

  const isDefault = Object.keys(defaultTemplates).includes(val);
  if (deleteTemplateButton) {
    deleteTemplateButton.style.display = isDefault ? "none" : "inline-flex";
  }
});

saveTemplateButton?.addEventListener("click", () => {
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;
  const text = composerTextarea?.value || "";

  if (!text.trim()) {
    alert(dict.promptEmptyNotice);
    return;
  }

  const name = prompt(dict.promptNameInput);
  if (!name || !name.trim()) return;

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("composerTemplates") || "{}");
  } catch (e) {
    saved = {};
  }

  const key = "tpl_" + Date.now();
  saved[key] = { name: name.trim(), text };
  localStorage.setItem("composerTemplates", JSON.stringify(saved));
  loadTemplates(key);
  alert(dict.promptSaveSuccess.replace("{name}", name.trim()));
});

deleteTemplateButton?.addEventListener("click", () => {
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;
  const val = templateSelect?.value;
  if (!val || Object.keys(defaultTemplates).includes(val) || val === "__new__") return;

  const opt = templateSelect.selectedOptions[0];
  const name = opt ? opt.textContent : "";

  if (!confirm(dict.promptDeleteConfirm.replace("{name}", name))) return;

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("composerTemplates") || "{}");
  } catch (e) {
    saved = {};
  }

  delete saved[val];
  localStorage.setItem("composerTemplates", JSON.stringify(saved));
  loadTemplates();
});

insertUrlTagButton?.addEventListener("click", () => {
  if (!composerTextarea) return;
  const start = composerTextarea.selectionStart ?? composerTextarea.value.length;
  const end = composerTextarea.selectionEnd ?? composerTextarea.value.length;
  const text = composerTextarea.value;
  const insertText = "{url}";
  composerTextarea.value = text.substring(0, start) + insertText + text.substring(end);
  composerTextarea.focus();
  const nextPos = start + insertText.length;
  composerTextarea.setSelectionRange(nextPos, nextPos);
});

clearComposerButton?.addEventListener("click", () => {
  if (composerTextarea) composerTextarea.value = "";
});

copyComposerTextButton?.addEventListener("click", async () => {
  if (!composerTextarea) return;
  await copyToClipboard(composerTextarea.value, copyComposerTextButton);
});

// ユーティリティ
async function copyToClipboard(text, button = null) {
  try {
    await navigator.clipboard.writeText(text);
    if (button) {
      const orig = button.textContent;
      button.textContent = "コピー完了!";
      button.classList.add("good");
      setTimeout(() => {
        button.textContent = orig;
        button.classList.remove("good");
      }, 1500);
    }
  } catch (err) {
    console.error("Clipboard copy failed:", err);
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

function generateRandomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createOutputName(originalName, mimeType, index = 0) {
  const dotIndex = originalName.lastIndexOf(".");
  const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
  const originalExt = dotIndex > 0 ? originalName.slice(dotIndex + 1) : "";

  const isRenameOn = enableRenameCheck?.checked ?? true;
  const isConvertOn = enableConvertCheck?.checked ?? true;

  let safeBase = baseName;

  if (isRenameOn) {
    const pattern = renamePattern?.value?.trim() || "{name}";
    safeBase = pattern.replaceAll("{name}", baseName);

    safeBase = safeBase.replace(/\{rand[ao]m(?::(\d+))?\}/g, (match, digits) => {
      const len = digits ? parseInt(digits, 10) : 6;
      return generateRandomString(len);
    });

    safeBase = safeBase.replace(/\{num(?::(\d+))?\}/g, (match, digits) => {
      const numValue = index + 1;
      if (digits) {
        const targetLength = parseInt(digits, 10);
        return String(numValue).padStart(targetLength, "0");
      }
      return String(numValue);
    });

    safeBase = safeBase.replace(/[\\/:*?"<>|]/g, "-");
  }

  const isImageMime = mimeType && (mimeType in extensions);
  const ext = (isConvertOn && isImageMime)
    ? extensions[mimeType]
    : (originalExt || "bin");

  return `${safeBase}.${ext}`;
}

function createZip(entries) {
  const files = [];
  const centralDirectory = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    files.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return new Blob([...files, ...centralDirectory, end], { type: "application/zip" });
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function downloadUrl(url, name) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
}

civitaiGalleryList?.addEventListener("click", async (event) => {
  const target = event.target;
  if (target.classList.contains("civitai-copy-btn")) {
    const rawUrl = target.dataset.url;
    if (!rawUrl) return;

    try {
      target.textContent = "解決中...";
      let finalUrl = rawUrl;
      try {
        const res = await fetch(rawUrl);
        if (res && res.url) finalUrl = res.url;
      } catch (e) {
        // CORS等で直接fetchできない場合はそのままrawUrlを使用
      }

      target.dataset.url = finalUrl;
      await copyToClipboard(finalUrl, target);
    } catch (err) {
      console.warn("Failed to copy civitai url:", err);
      await copyToClipboard(rawUrl, target);
    }
  }
});

