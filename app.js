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
  HeadObjectCommand,
  PutBucketCorsCommand,
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
    dropText: "ファイルやフォルダをここにドロップ",
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
    btnUploadR2: "⚡ R2へ保存",
    btnUploadFilebase: "🪐 Filebaseへ保存",
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
    tempPasswordLabel: "🔑 閲覧パスワード",
    tempPasswordPlaceholder: "合言葉を設定",
    optionalText: "(任意)",
    quickUploadHeading: "🚀 外部投稿 / Windows「送る」連携",
    uploadApiUrl: "投稿API エンドポイント URL",
    btnCopyUrl: "📋 URLをコピー",
    btnCopyCurl: "💻 curl例をコピー",
    btnDownloadSendTo: "📥 Windows「送る」登録バッチ",
    uploadApiNote: "※ 本APIで投稿されたファイルは Filebase(IPFS) または R2 に保存され、短縮URLが発行されます。",
    sendToUninstallNote: "※「送る」から解除・削除したい場合: <code>Win + R</code> ➜ <code>shell:sendto</code> で開くフォルダからバッチを削除してください。",
    passwordBadge: "🔒 パスワード保護",
    qrModalTitle: "📱 スマホ/別端末でスキャン",
    qrModalSub: "スマホのカメラ等で下記QRコードを読み取ると、Civitaiウォッチリストや接続設定が安全に直接引き継がれます。",
    civitaiGalleryHeading: "🎨 Civitai ギャラリー & クリエイターウォッチ",
    civitaiUsernameLabel: "👤 クリエイター:",
    civitaiAllCreators: "🌐 すべて (新着順)",
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
    copyPrompt: "プロンプトコピー",
    copyAllPrompts: "📝 プロンプト一括コピー",
    civitaiPrompt: "📝 プロンプト",
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
    dropText: "Drop files or folders here",
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
    btnUploadR2: "⚡ Save to R2",
    btnUploadFilebase: "🪐 Save to Filebase",
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
    tempPasswordLabel: "🔑 Access Password",
    tempPasswordPlaceholder: "Set password phrase",
    optionalText: "(Optional)",
    quickUploadHeading: "🚀 Quick Upload / Windows 'Send To'",
    uploadApiUrl: "Upload API Endpoint URL",
    btnCopyUrl: "📋 Copy URL",
    btnCopyCurl: "💻 Copy curl",
    btnDownloadSendTo: "📥 Windows 'Send To' Batch",
    uploadApiNote: "※ Files uploaded via this API are stored in Filebase (IPFS) or R2 with a short URL.",
    sendToUninstallNote: "※ To remove from 'Send To': Press <code>Win + R</code> ➜ type <code>shell:sendto</code> and delete the batch file.",
    passwordBadge: "🔒 Password Protected",
    qrModalTitle: "📱 Scan with Mobile / Other Device",
    qrModalSub: "Scan this QR code with your mobile camera to securely transfer your Civitai watch list, connection settings, and preferences.",
    civitaiGalleryHeading: "🎨 Civitai Gallery & Watcher",
    civitaiUsernameLabel: "👤 Creator:",
    civitaiAllCreators: "🌐 All (Newest)",
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
    copyPrompt: "Copy Prompt",
    copyAllPrompts: "📝 Copy All Prompts",
    civitaiPrompt: "📝 Prompt",
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

// MIME タイプの判定
const getContentTypeFromFilename = (filename, fallback = "application/octet-stream") => {
  const ext = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    // 画像
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    jxl: "image/jxl",
    avif: "image/avif",
    bmp: "image/bmp",
    ico: "image/x-icon",
    // 動画
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    m4v: "video/mp4",
    avi: "video/x-msvideo",
    ogv: "video/ogg",
    // 音声
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    aac: "audio/aac",
    // 圧縮アーカイブ
    zip: "application/zip",
    "7z": "application/x-7z-compressed",
    rar: "application/vnd.rar",
    tar: "application/x-tar",
    gz: "application/gzip",
    // 文書・テキスト
    pdf: "application/pdf",
    txt: "text/plain; charset=utf-8",
    md: "text/markdown; charset=utf-8",
    json: "application/json; charset=utf-8",
    csv: "text/csv; charset=utf-8",
  };
  return mimeTypes[ext] || fallback;
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
const copyAllPromptsBtn = document.querySelector("#copyAllPromptsBtn");
const civitaiPromptsMap = {};

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
const convertUploadR2Button = document.querySelector("#convertUploadR2Button");
const convertUploadFilebaseButton = document.querySelector("#convertUploadFilebaseButton");
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

// 🪐 Filebase 接続設定フォーム要素
const filebaseBucket = document.querySelector("#filebaseBucket");
const filebaseApiKey = document.querySelector("#filebaseApiKey");
const filebaseSecretKey = document.querySelector("#filebaseSecretKey");

const cfStatus = document.querySelector("#cfStatus");
const cfSettingsAccordion = document.querySelector("#cfSettingsAccordion");
const cfSaveButton = document.querySelector("#cfSaveButton");
const cfClearButton = document.querySelector("#cfClearButton");
const cfShareQrButton = document.querySelector("#cfShareQrButton");
const cfBackupUrlButton = document.querySelector("#cfBackupUrlButton");
const topbarSyncButton = document.querySelector("#topbarSyncButton");
const globalClearButton = document.querySelector("#globalClearButton");
const providerR2 = document.querySelector("#providerR2");
const providerFilebase = document.querySelector("#providerFilebase");
const filebaseCorsButton = document.querySelector("#filebaseCorsButton");
const cfDashboardLink = document.querySelector("#cfDashboardLink");

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

// R2 & Filebase ファイル一覧 & タブ要素
const storageTabR2 = document.querySelector("#storageTabR2");
const storageTabFilebase = document.querySelector("#storageTabFilebase");
let activeStorageTab = localStorage.getItem("activeStorageTab") || "r2";

const r2FileList = document.querySelector("#r2FileList");
const reloadR2FilesButton = document.querySelector("#reloadR2FilesButton");
const deleteSelectedR2FilesButton = document.querySelector("#deleteSelectedR2FilesButton");
const storageLimitRange = document.querySelector("#storageLimitRange");
const storageLimitOutput = document.querySelector("#storageLimitOutput");
const storageUsageText = document.querySelector("#storageUsageText");
const storageUsageBar = document.querySelector("#storageUsageBar");
const autoCleanupCheckbox = document.querySelector("#autoCleanupCheckbox");
const autoFifoCheckbox = document.querySelector("#autoFifoCheckbox");

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

// --- S3 クライアント生成 ＆ ストレージ接続判定ヘルパー ---
let s3ClientR2 = null;
let s3ClientFilebase = null;

function isR2Configured() {
  const accountId = (localStorage.getItem("r2AccountId") || r2AccountId?.value || "").trim();
  const bucketName = (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();
  const accessKeyId = (localStorage.getItem("r2AccessKeyId") || r2AccessKeyId?.value || "").trim();
  const secretAccessKey = (localStorage.getItem("r2SecretAccessKey") || r2SecretAccessKey?.value || "").trim();
  const domain = getSelectedR2Domain();
  return Boolean(accountId && bucketName && accessKeyId && secretAccessKey && domain);
}

function isFilebaseConfigured() {
  const bucketName = (localStorage.getItem("filebaseBucket") || filebaseBucket?.value || "").trim();
  const accessKeyId = (localStorage.getItem("filebaseApiKey") || filebaseApiKey?.value || "").trim();
  const secretAccessKey = (localStorage.getItem("filebaseSecretKey") || filebaseSecretKey?.value || "").trim();
  const domain = getSelectedR2Domain();
  return Boolean(bucketName && accessKeyId && secretAccessKey && domain);
}

function getBucketName(provider = "r2") {
  if (provider === "filebase") {
    return (localStorage.getItem("filebaseBucket") || filebaseBucket?.value || "").trim();
  }
  return (localStorage.getItem("r2BucketName") || r2BucketName?.value || "").trim();
}

function getS3Client(provider = "r2") {
  if (provider === "filebase") {
    const accessKeyId = (localStorage.getItem("filebaseApiKey") || filebaseApiKey?.value || "").trim();
    const secretAccessKey = (localStorage.getItem("filebaseSecretKey") || filebaseSecretKey?.value || "").trim();
    if (!accessKeyId || !secretAccessKey) return null;

    s3ClientFilebase = new S3Client({
      region: "us-east-1",
      endpoint: "https://s3.filebase.io",
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    return s3ClientFilebase;
  }

  // デフォルト: Cloudflare R2
  const accountId = (localStorage.getItem("r2AccountId") || r2AccountId?.value || "").trim();
  const accessKeyId = (localStorage.getItem("r2AccessKeyId") || r2AccessKeyId?.value || "").trim();
  const secretAccessKey = (localStorage.getItem("r2SecretAccessKey") || r2SecretAccessKey?.value || "").trim();
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  s3ClientR2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  return s3ClientR2;
}

// Filebase S3 バケットの CORS 自動設定 (CID 読み取りヘッダー公開)
async function configureFilebaseCors() {
  const s3 = getS3Client("filebase");
  const bucketName = getBucketName("filebase");

  if (!s3 || !bucketName) {
    alert("⚠️ Filebaseのバケット名、Access Key、Secret Keyを入力してから実行してください。");
    return;
  }

  const btn = filebaseCorsButton;
  const origText = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⚙️ 設定中...";
  }

  try {
    const corsCommand = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "HEAD", "DELETE"],
            AllowedHeaders: ["*"],
            ExposeHeaders: [
              "ETag",
              "x-amz-meta-cid",
              "x-amz-meta-ipfs-hash",
              "x-amz-meta-size",
              "x-amz-meta-original-size",
            ],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });
    await s3.send(corsCommand);
    alert(`✅ Filebaseバケット「${bucketName}」にIPFS CID公開用CORS設定を適用しました！\nこれでブラウザからIPFS CIDが正常に取得できます。`);
  } catch (err) {
    console.error("CORS設定失敗:", err);
    alert(`❌ CORS設定の適用に失敗しました:\n${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText;
    }
  }
}

// --- 🪐 IPFS CID キャッシュ管理 ---
function getStoredIpfsCid(key) {
  if (!key) return null;
  try {
    const map = JSON.parse(localStorage.getItem("ipfsCidMap") || "{}");
    return map[key] || null;
  } catch (e) {
    return null;
  }
}

function storeIpfsCid(key, cid) {
  if (!key || !cid) return;
  try {
    const map = JSON.parse(localStorage.getItem("ipfsCidMap") || "{}");
    map[key] = cid;
    localStorage.setItem("ipfsCidMap", JSON.stringify(map));
  } catch (e) {}
  // Cloudflare KV へも非同期登録
  registerKvCid(key, cid);
}

async function registerKvCid(key, cid, size = 0, mime = "", s3Key = "", password = "") {
  if (!key || !cid) return;
  try {
    const payload = { key, cid, size, mime, s3Key: s3Key || key };
    if (password && typeof password === "string" && password.trim().length > 0) {
      payload.password = password.trim();
    }
    await fetch("/api/ipfs-kv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("Failed to register CID to KV:", e);
  }
}

async function deleteKvCid(key) {
  if (!key) return;
  try {
    await fetch(`/api/ipfs-kv?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
  } catch (e) {
    console.warn("Failed to delete CID from KV:", e);
  }
}

async function fetchKvFiles() {
  try {
    const res = await fetch("/api/ipfs-kv");
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (e) {
    console.warn("Failed to fetch KV files:", e);
    return [];
  }
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

// --- R2 / Filebase 設定状態の更新 (STEP 1のURL必須ルールを堅持) ---
function updateR2Status() {
  // 🔒 STEP 1: 配信ドメインが1件以上存在し、有効に選択されていること
  const selectedDomain = getSelectedR2Domain();
  const isStep1Ok = Boolean(selectedDomain && selectedDomain.trim());

  // 🔒 STEP 2 のロック制御 (STEP 1 未設定時は完全ブロック)
  const step2Box = document.querySelector("#r2KeysStepContainer");
  const step2Notice = document.querySelector("#step2Notice");
  const step2Inputs = [
    r2AccountId, r2BucketName, r2AccessKeyId, r2SecretAccessKey,
    filebaseBucket, filebaseApiKey, filebaseSecretKey
  ];

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

  const r2Ok = isR2Configured();
  const fbOk = isFilebaseConfigured();

  if (cfStatus) {
    const statusParts = [];
    if (r2Ok) {
      statusParts.push(`<span style="color: #4caf50;">⚡ R2 設定済 (${escapeHtml(getBucketName("r2"))})</span>`);
    } else {
      statusParts.push(`<span style="color: var(--muted);">⚡ R2 未設定</span>`);
    }

    if (fbOk) {
      statusParts.push(`<span style="color: #38bdf8;">🪐 Filebase 設定済 (${escapeHtml(getBucketName("filebase"))})</span>`);
    } else {
      statusParts.push(`<span style="color: var(--muted);">🪐 Filebase 未設定</span>`);
    }

    cfStatus.innerHTML = statusParts.join(" &nbsp;|&nbsp; ");
  }

  if (convertUploadR2Button) {
    convertUploadR2Button.disabled = !r2Ok || (state.files.length === 0);
  }
  if (convertUploadFilebaseButton) {
    convertUploadFilebaseButton.disabled = !fbOk || (state.files.length === 0);
  }

  return r2Ok || fbOk;
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
  if (list.length === 0) return "";
  const saved = (localStorage.getItem("civitaiUsername") || "").trim();
  if (saved === "__ALL__" || list.includes(saved)) {
    return saved;
  }
  return "__ALL__";
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
    const isSingleUser = username && username !== "__ALL__";
    civitaiProfileLink.href = isSingleUser ? `https://civitai.com/user/${encodeURIComponent(username)}/images` : "https://civitai.com";
  }
  return Boolean(username);
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
    const allLabel = dict.civitaiAllCreators || "🌐 すべて (新着順)";
    const isAllSelected = (currentUser === "__ALL__" || !currentUser);
    const hasAnyUnread = unreadUsers.size > 0;
    const allPrefix = hasAnyUnread ? "🔴 " : "";
    const allOption = `<option value="__ALL__" style="background-color: #1a1c23; color: #38bdf8; font-weight: bold;"${isAllSelected ? " selected" : ""}>${allPrefix}${escapeHtml(allLabel)}</option>`;

    const userOptions = list.map(u => {
      const isUnread = unreadUsers.has(u);
      const prefix = isUnread ? "🔴 👤 " : "👤 ";
      const suffix = isUnread ? (lang === "en" ? " (New)" : " (新着)") : "";
      const selected = (u === currentUser && !isAllSelected) ? " selected" : "";
      return `<option value="${escapeHtml(u)}" style="background-color: #1a1c23; color: #f8fafc;"${selected}>${prefix}${escapeHtml(u)}${suffix}</option>`;
    }).join("");

    civitaiUserSelect.innerHTML = allOption + userOptions;
  }

  if (civitaiUserDeleteBtn) {
    const canDelete = Boolean(currentUser && currentUser !== "__ALL__");
    civitaiUserDeleteBtn.disabled = !canDelete;
    civitaiUserDeleteBtn.style.opacity = canDelete ? "1" : "0.35";
    civitaiUserDeleteBtn.style.cursor = canDelete ? "pointer" : "not-allowed";
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
  const list = getCivitaiUserList();
  const username = getCurrentCivitaiUser() || "__ALL__";
  const isAll = (username === "__ALL__");

  if (list.length === 0) {
    civitaiGalleryList.innerHTML = `<span class="item-meta" style="padding: 18px; color: var(--muted); text-align: center; display: block;">${escapeHtml(dict.civitaiEmptyDesc || "Civitai クリエイターが登録されていません。「＋」ボタンから気になるクリエイター名を追加してください。")}</span>`;
    return;
  }

  const loadingMsg = isAll
    ? (lang === "en" ? "Fetching newest posts from all creators..." : "登録クリエイター全員の新着を取得中...")
    : `Civitai からメディアを取得中 (${escapeHtml(username)})...`;
  civitaiGalleryList.innerHTML = `<span class="status-text" style="padding: 18px;">${escapeHtml(loadingMsg)}</span>`;

  try {
    let items = [];
    if (isAll) {
      const fetches = list.map(async (u) => {
        try {
          const res = await fetch(`https://civitai.com/api/v1/images?username=${encodeURIComponent(u)}&limit=25&sort=Newest&browsingLevel=127&nsfw=true&_t=${Date.now()}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.items || []).map(it => ({ ...it, _creator: u }));
        } catch (e) {
          return [];
        }
      });
      const results = await Promise.all(fetches);
      items = results.flat();
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const res = await fetch(`https://civitai.com/api/v1/images?username=${encodeURIComponent(username)}&limit=50&sort=Newest&browsingLevel=127&nsfw=true&_t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      items = (data.items || []).map(it => ({ ...it, _creator: username }));
    }

    // 新着判定
    const lastSeenMap = getCivitaiLastSeenMap();
    let newItemsCount = 0;

    if (!isAll) {
      const lastSeenId = Number(lastSeenMap[username] || 0);
      const newestId = items.length > 0 ? Number(items[0].id) : 0;
      if (lastSeenId === 0) {
        if (newestId > 0) {
          lastSeenMap[username] = newestId;
          saveCivitaiLastSeenMap(lastSeenMap);
        }
      } else if (newestId > lastSeenId) {
        newItemsCount = items.filter(it => Number(it.id) > lastSeenId).length;
      }
    } else {
      list.forEach(u => {
        const lastSeenId = Number(lastSeenMap[u] || 0);
        if (lastSeenId > 0) {
          const uItems = items.filter(it => it._creator === u && Number(it.id) > lastSeenId);
          newItemsCount += uItems.length;
        }
      });
    }

    if (newItemsCount > 0) {
      if (civitaiNewBadge) {
        civitaiNewBadge.textContent = `🔴 ${(dict.civitaiNewBadge || "{count}件の新着").replace("{count}", newItemsCount)}`;
        civitaiNewBadge.style.display = "inline-flex";
      }
      if (civitaiMarkReadBtn) {
        civitaiMarkReadBtn.style.display = "inline-flex";
        civitaiMarkReadBtn.onclick = () => {
          if (!isAll) {
            const newestId = items.length > 0 ? Number(items[0].id) : 0;
            if (newestId > 0) lastSeenMap[username] = newestId;
          } else {
            list.forEach(u => {
              const uFirst = items.find(it => it._creator === u);
              if (uFirst) lastSeenMap[u] = Number(uFirst.id);
            });
          }
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

    civitaiGalleryList.className = "result-list civitai-grid";
    civitaiGalleryList.innerHTML = "";
    if (items.length === 0) {
      civitaiGalleryList.innerHTML = `<span class="item-meta" style="padding: 18px; text-align: center;">Civitai に投稿されたメディアが見つかりませんでした。</span>`;
      return;
    }

    items.forEach(item => {
      const itemCreator = item._creator || item.username || "";
      const lastSeenId = Number(lastSeenMap[itemCreator] || 0);
      const isNewItem = (lastSeenId > 0 && Number(item.id) > lastSeenId);
      const article = document.createElement("article");
      article.className = "civitai-card";

      const isVideo = item.type === "video";
      const directUrl = item.url;
      const civitaiPostPageUrl = `https://civitai.com/images/${item.id}`;

      let thumbHtml = "";
      if (isVideo) {
        thumbHtml = `
          <video src="${escapeHtml(directUrl)}" preload="metadata" muted playsinline loop style="pointer-events: none;"></video>
          <div class="civitai-video-play-indicator">▶</div>
        `;
      } else {
        const previewSrc = directUrl.includes("/original=true/") ? directUrl.replace("/original=true/", "/width=450/") : directUrl;
        thumbHtml = `<img alt="" src="${escapeHtml(previewSrc)}" loading="lazy">`;
      }

      const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
      const dimensions = item.width && item.height ? `${item.width}×${item.height}` : "";

      const creatorTagHtml = itemCreator
        ? `<button type="button" class="civitai-creator-tag" data-username="${escapeHtml(itemCreator)}" title="${escapeHtml(itemCreator)} の投稿だけに絞り込む">👤 ${escapeHtml(itemCreator)}</button>`
        : `<span></span>`;

      const civitaiPrompt = item.meta?.prompt;
      if (civitaiPrompt) {
        civitaiPromptsMap[item.id] = civitaiPrompt;
      }

      const promptBtnHtml = civitaiPrompt
        ? `<button type="button" class="ghost-button civitai-prompt-btn" data-id="${item.id}" style="height: 30px; font-size: 11px; padding: 0 8px; color: #fbbf24; border-color: rgba(251, 191, 36, 0.4); display: inline-flex; align-items: center; gap: 3px;" title="生成プロンプトをコピー">📝 ${escapeHtml(dict.civitaiPrompt || "プロンプト")}</button>`
        : "";

      article.innerHTML = `
        <div class="civitai-card-media-wrap" style="position: relative; width: 100%; aspect-ratio: 3 / 4; background: #090a0f; overflow: hidden;">
          <a href="${escapeHtml(directUrl)}" target="_blank" rel="noopener noreferrer" class="civitai-card-media" title="直リンクを表示">
            ${thumbHtml}
          </a>
          <div class="civitai-card-overlay-top">
            ${creatorTagHtml}
            <div class="civitai-card-badges-col">
              ${isNewItem ? `<span class="civitai-new-item-badge" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.9); backdrop-filter: blur(4px); color: #fff; border: 1px solid rgba(239, 68, 68, 0.5); font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">✨ NEW</span>` : ""}
              ${isVideo ? `<span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(14, 165, 233, 0.9); backdrop-filter: blur(4px); color: #fff; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎬 VIDEO</span>` : ""}
              <span class="civitai-wf-badge-placeholder" data-id="${item.id}"></span>
              ${item.nsfwLevel && item.nsfwLevel !== "None" ? `<span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(244, 63, 94, 0.9); backdrop-filter: blur(4px); color: #fff; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${escapeHtml(item.nsfwLevel)}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="civitai-card-body">
          <div class="civitai-card-meta-row">
            <span class="item-id">#${escapeHtml(String(item.id))}</span>
            <span style="font-size: 10.5px;">${escapeHtml(dateStr)} ${dimensions ? `· ${escapeHtml(dimensions)}` : ""}</span>
          </div>
          <div class="civitai-card-stats">
            ${createCivitaiStatsHtml(item.stats)}
          </div>
          <div class="civitai-card-actions">
            ${promptBtnHtml}
            <button type="button" class="ghost-button civitai-copy-btn" data-url="${escapeHtml(directUrl)}" style="flex: 1; height: 30px; font-size: 11px; padding: 0 8px; justify-content: center;">📋 ${escapeHtml(dict.copyUrl || "URLコピー")}</button>
            <a href="${escapeHtml(civitaiPostPageUrl)}" target="_blank" rel="noopener noreferrer" class="ghost-button civitai-post-link" style="height: 30px; font-size: 11px; padding: 0 8px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;" title="Civitai で投稿の編集・削除・確認を行う">Civitai ↗</a>
          </div>
        </div>
      `;

      if (isVideo) {
        const videoEl = article.querySelector("video");
        if (videoEl) {
          article.addEventListener("mouseenter", () => {
            videoEl.play().catch(() => {});
          });
          article.addEventListener("mouseleave", () => {
            videoEl.pause();
          });
        }
      }

      civitaiGalleryList.append(article);

      checkCivitaiItemWf(item).then(hasWf => {
        if (hasWf) {
          const badgePlaceholder = article.querySelector('.civitai-wf-badge-placeholder');
          if (badgePlaceholder) {
            badgePlaceholder.innerHTML = '<span class="meta-badge" style="background: rgba(16, 185, 129, 0.9); backdrop-filter: blur(4px); color: #fff; border: 1px solid rgba(16, 185, 129, 0.6); font-size: 9.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="ComfyUIワークフローが完全な形で含まれています。">🧬 WF</span>';
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
  const savedProvider = localStorage.getItem("storageProvider") || "r2";
  if (savedProvider === "filebase") {
    if (providerFilebase) providerFilebase.checked = true;
  } else {
    if (providerR2) providerR2.checked = true;
  }

  const savedAccount   = localStorage.getItem("r2AccountId") || "";
  const savedBucket    = localStorage.getItem("r2BucketName") || "";
  const savedKeyId     = localStorage.getItem("r2AccessKeyId") || "";
  const savedSecret    = localStorage.getItem("r2SecretAccessKey") || "";
  const savedPublic    = localStorage.getItem("r2PublicDomain") || "";
  const savedDev       = localStorage.getItem("r2DevDomain") || "";

  const savedFbBucket  = localStorage.getItem("filebaseBucket") || "";
  const savedFbKeyId   = localStorage.getItem("filebaseApiKey") || "";
  const savedFbSecret  = localStorage.getItem("filebaseSecretKey") || "";

  if (r2AccountId) r2AccountId.value = savedAccount;
  if (r2BucketName) r2BucketName.value = savedBucket;
  if (r2AccessKeyId) r2AccessKeyId.value = savedKeyId;
  if (r2SecretAccessKey) r2SecretAccessKey.value = savedSecret;

  if (filebaseBucket) filebaseBucket.value = savedFbBucket;
  if (filebaseApiKey) filebaseApiKey.value = savedFbKeyId;
  if (filebaseSecretKey) filebaseSecretKey.value = savedFbSecret;

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

  const savedAutoFifo = localStorage.getItem("autoFifo");
  if (autoFifoCheckbox) {
    autoFifoCheckbox.checked = savedAutoFifo !== "false"; // デフォルトでON
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

  // ☁️ 復元後に自動保存 & R2ファイル一覧同期を確実に実行
  if (payload.a && payload.b && payload.k && payload.s) {
    saveR2SettingsAuto();
    fetchAndRenderR2Files();
  }

  return hasRestoredAny;
}

// PINコード付き暗号化バックアップURLの発行
async function generatePinBackupUrl() {
  // 💾 バックアップ発行前に最新の入力状態を自動で一回保存
  saveR2SettingsAuto();

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

function saveR2SettingsAuto() {
  s3ClientR2 = null;
  s3ClientFilebase = null;

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

  if (accountId) localStorage.setItem("r2AccountId", accountId);
  if (bucketName) localStorage.setItem("r2BucketName", bucketName);
  if (accessKeyId) localStorage.setItem("r2AccessKeyId", accessKeyId);
  if (secretAccessKey) localStorage.setItem("r2SecretAccessKey", secretAccessKey);

  const fbBucket = filebaseBucket?.value?.trim() || "";
  const fbKeyId = filebaseApiKey?.value?.trim() || "";
  const fbSecret = filebaseSecretKey?.value?.trim() || "";

  if (fbBucket) localStorage.setItem("filebaseBucket", fbBucket);
  if (fbKeyId) localStorage.setItem("filebaseApiKey", fbKeyId);
  if (fbSecret) localStorage.setItem("filebaseSecretKey", fbSecret);

  const isConfigured = updateR2Status();
  render();

  if (r2AutoFetchTimer) clearTimeout(r2AutoFetchTimer);
  if (isConfigured) {
    r2AutoFetchTimer = setTimeout(() => {
      fetchAndRenderR2Files();
    }, 400);
  }
};

filebaseCorsButton?.addEventListener("click", configureFilebaseCors);

r2AccountId?.addEventListener("input", saveR2SettingsAuto);
r2BucketName?.addEventListener("input", saveR2SettingsAuto);
r2AccessKeyId?.addEventListener("input", saveR2SettingsAuto);
r2SecretAccessKey?.addEventListener("input", saveR2SettingsAuto);

filebaseBucket?.addEventListener("input", saveR2SettingsAuto);
filebaseApiKey?.addEventListener("input", saveR2SettingsAuto);
filebaseSecretKey?.addEventListener("input", saveR2SettingsAuto);

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

  localStorage.removeItem("filebaseBucket");
  localStorage.removeItem("filebaseApiKey");
  localStorage.removeItem("filebaseSecretKey");

  if (r2AccountId) r2AccountId.value = "";
  if (r2BucketName) r2BucketName.value = "";
  if (r2AccessKeyId) r2AccessKeyId.value = "";
  if (r2SecretAccessKey) r2SecretAccessKey.value = "";

  if (filebaseBucket) filebaseBucket.value = "";
  if (filebaseApiKey) filebaseApiKey.value = "";
  if (filebaseSecretKey) filebaseSecretKey.value = "";

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

autoFifoCheckbox?.addEventListener("change", () => {
  localStorage.setItem("autoFifo", String(autoFifoCheckbox.checked));
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
function parseA1111Parameters(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const negIndex = trimmed.indexOf("Negative prompt:");
  const stepsIndex = trimmed.search(/\bSteps:\s*\d+/);

  let prompt = "";
  let negativePrompt = "";
  let params = "";

  if (negIndex !== -1) {
    prompt = trimmed.substring(0, negIndex).trim();
    if (stepsIndex !== -1 && stepsIndex > negIndex) {
      negativePrompt = trimmed.substring(negIndex + "Negative prompt:".length, stepsIndex).trim();
      params = trimmed.substring(stepsIndex).trim();
    } else {
      negativePrompt = trimmed.substring(negIndex + "Negative prompt:".length).trim();
    }
  } else if (stepsIndex !== -1) {
    prompt = trimmed.substring(0, stepsIndex).trim();
    params = trimmed.substring(stepsIndex).trim();
  } else {
    prompt = trimmed;
  }

  return { prompt, negativePrompt, params, raw: trimmed };
}

function unescapeJsonString(str) {
  if (!str) return "";
  try {
    const sanitized = str.replace(/[\u0000-\u001f]/g, (c) => {
      if (c === "\n") return "\\n";
      if (c === "\r") return "\\r";
      if (c === "\t") return "\\t";
      return "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
    });
    return JSON.parse(`"${sanitized}"`);
  } catch (e) {
    return str
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

const EXCLUDE_WORDS = new Set([
  "true", "false", "null", "undefined", "none", "fixed", "increment",
  "decrement", "randomize", "auto", "enable", "disable", "cpu", "gpu", "cuda",
  "euler", "euler_ancestral", "heun", "dpm_2", "karras", "exponential",
  "normal", "simple", "ddim", "uni_pc"
]);

function isExcludedString(s) {
  if (!s || s.length < 3) return true;
  const lower = s.toLowerCase().trim();
  if (EXCLUDE_WORDS.has(lower)) return true;
  if (/^https?:\/\//i.test(lower)) return true;
  if (/\.(safetensors|ckpt|pt|bin|pth|onnx|engine|yaml|json|png|jpg|jpeg|webp|mp4|webm|gif|mov)$/i.test(lower)) return true;
  if (/^[\d\s.,_-]+$/.test(lower)) return true;
  return false;
}

function extractPromptsFromRawText(text) {
  if (!text || typeof text !== "string") return null;

  // AI関連キーワードが一切ない場合は重い走査をスキップ（高速化）
  const hasAiHint = text.includes('"inputs"') || 
                    text.includes('"class_type"') || 
                    text.includes('"prompt"') || 
                    text.includes('"workflow"') || 
                    text.includes('"nodes"') ||
                    text.includes('"widgets_values"') ||
                    text.includes('Negative prompt:') ||
                    text.includes('Steps:');
  if (!hasAiHint) return null;

  const candidates = [];

  const addCandidate = (rawVal) => {
    const val = unescapeJsonString(rawVal).trim();
    if (!isExcludedString(val) && !candidates.includes(val)) {
      candidates.push(val);
    }
  };

  // 1. "widgets_values": [...] の配列内を走査 (UI workflow形式)
  const widgetArrayMatches = text.matchAll(/"widgets_values"\s*:\s*\[([\s\S]*?)\]/gi);
  for (const m of widgetArrayMatches) {
    const arrayContent = m[1];
    const stringMatches = arrayContent.matchAll(/"((?:[^"\\]|\\.)*)"/gi);
    for (const sm of stringMatches) {
      addCandidate(sm[1]);
    }
  }

  // 2. キー名による抽出 ("text", "prompt", "positive", "caption", "text_positive", etc.)
  const keyMatches = text.matchAll(/"(?:text|prompt|positive|text_positive|caption|prompt_text)"\s*:\s*"((?:[^"\\]|\\.)*)"/gi);
  for (const m of keyMatches) {
    addCandidate(m[1]);
  }

  if (candidates.length === 0) return null;

  const negKeywords = ["low quality", "worst quality", "blurry", "bad anatomy", "watermark", "deformed", "ugly", "nsfw", "lowres", "bad hands", "error", "missing fingers"];
  const positives = [];
  const negatives = [];

  for (const c of candidates) {
    const lower = c.toLowerCase();
    const isNeg = negKeywords.some(k => lower.includes(k)) || lower.startsWith("negative") || lower.includes("embedding:");
    if (isNeg) {
      negatives.push(c);
    } else {
      positives.push(c);
    }
  }

  let prompt = "";
  let negativePrompt = "";

  if (positives.length > 0) {
    positives.sort((a, b) => b.length - a.length);
    prompt = positives[0];
    if (negatives.length > 0) {
      negativePrompt = negatives[0];
    } else if (positives.length > 1) {
      negativePrompt = positives[1];
    }
  } else {
    prompt = candidates[0];
    if (candidates.length > 1) negativePrompt = candidates[1];
  }

  return {
    prompt,
    negativePrompt,
    params: `Extracted ${candidates.length} candidate(s)`,
    raw: text.slice(0, 5000),
  };
}

function parseComfyPromptJson(rawJson) {
  if (!rawJson) return null;
  let obj = null;
  try {
    obj = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
  } catch (e) {
    if (typeof rawJson === "string") {
      return extractPromptsFromRawText(rawJson);
    }
    return null;
  }
  if (!obj || typeof obj !== "object") return null;

  // { prompt: { ... }, workflow: { ... } } などのラッパー対応
  const targetObj = (obj.prompt && typeof obj.prompt === "object") ? obj.prompt : obj;

  const textNodes = [];
  for (const k of Object.keys(targetObj)) {
    const node = targetObj[k];
    if (node && node.inputs) {
      const val = node.inputs.text || node.inputs.prompt || node.inputs.positive || node.inputs.text_positive || node.inputs.caption;
      if (typeof val === "string" && !isExcludedString(val)) {
        textNodes.push({
          type: node.class_type || "CLIPTextEncode",
          text: val.trim(),
        });
      }
    }
  }

  const wfObj = (obj.workflow && typeof obj.workflow === "object") ? obj.workflow : obj;
  if (textNodes.length === 0 && Array.isArray(wfObj.nodes)) {
    for (const node of wfObj.nodes) {
      if (node && Array.isArray(node.widgets_values)) {
        for (const val of node.widgets_values) {
          if (typeof val === "string" && !isExcludedString(val)) {
            textNodes.push({
              type: node.type || "CLIPTextEncode",
              text: val.trim(),
            });
          }
        }
      }
    }
  }

  if (textNodes.length === 0) {
    return extractPromptsFromRawText(JSON.stringify(obj));
  }

  const prompt = textNodes[0]?.text || "";
  const negativePrompt = textNodes.length > 1 ? textNodes[1]?.text : "";
  return {
    prompt,
    negativePrompt,
    params: `Nodes: ${textNodes.length}`,
    raw: typeof rawJson === "string" ? rawJson : JSON.stringify(rawJson, null, 2),
  };
}

function parseNovelAiComment(raw) {
  if (!raw) return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (obj && (obj.prompt || obj.uc)) {
      return {
        prompt: obj.prompt || "",
        negativePrompt: obj.uc || "",
        params: `Steps: ${obj.steps || ""}, Scale: ${obj.scale || ""}, Seed: ${obj.seed || ""}`,
        raw: typeof raw === "string" ? raw : JSON.stringify(raw),
      };
    }
  } catch (e) {}
  return null;
}

async function detectComfyMetadata(file) {
  if (!file) return { hasWorkflow: false, hasPrompt: false, hasA1111: false, type: "none" };

  const fileName = (file.name || "").toLowerCase();
  const isPng = fileName.endsWith(".png") || file.type === "image/png";
  const isMp4 = fileName.endsWith(".mp4") || file.type === "video/mp4";
  const isWebm = fileName.endsWith(".webm") || file.type === "video/webm";

  let promptDetails = null;

  try {
    // 1. 先頭領域（10MB以下の動画クリップは全体、それ以外は先頭 5MB）
    const isSmallVideo = (isMp4 || isWebm) && file.size <= 10 * 1024 * 1024;
    const headSize = isSmallVideo ? file.size : Math.min(file.size, 5 * 1024 * 1024);
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
                  if (!promptDetails) promptDetails = parseComfyPromptJson(wfJson);
                } catch (e) {}
              } else if (keyword === "prompt") {
                hasPrompt = true;
                try {
                  const text = new TextDecoder("utf-8").decode(chunkData.subarray(nullIndex + 1));
                  const parsed = parseComfyPromptJson(text);
                  if (parsed && parsed.prompt) promptDetails = parsed;
                } catch (e) {}
              } else if (keyword === "parameters") {
                hasA1111 = true;
                try {
                  const text = new TextDecoder("utf-8").decode(chunkData.subarray(nullIndex + 1));
                  promptDetails = parseA1111Parameters(text);
                } catch (e) {}
              } else if (keyword === "Comment") {
                try {
                  const text = new TextDecoder("utf-8").decode(chunkData.subarray(nullIndex + 1));
                  if (!promptDetails) promptDetails = parseNovelAiComment(text);
                } catch (e) {}
              }
            }
          }

          offset += chunkLength + 4;
        }

        if (hasWorkflow) return { hasWorkflow: true, hasPrompt, hasA1111, nodeCount, type: "comfy_workflow", promptDetails };
        if (hasPrompt) return { hasWorkflow: false, hasPrompt: true, hasA1111, type: "comfy_prompt", promptDetails };
        if (hasA1111) return { hasWorkflow: false, hasPrompt: false, hasA1111: true, type: "a1111", promptDetails };
      }
    }

    // 2. テキスト判定
    let textSample = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(headBuffer));

    // 3. 動画（MP4 / WebM）で 10MB 超の場合、末尾（moov atom）も読み込む
    if ((isMp4 || isWebm) && file.size > headSize) {
      const tailSize = Math.min(file.size, 5 * 1024 * 1024);
      const tailBuffer = await file.slice(file.size - tailSize).arrayBuffer();
      const tailText = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(tailBuffer));
      textSample = textSample + "\n" + tailText;
    }

    // 判定ロジック（ComfyUI-VideoHelperSuite / VHS 形式対応 & 汎用プロンプト検出）
    const hasWf = (textSample.includes('"nodes"') && textSample.includes('"links"')) ||
                  (textSample.includes('"workflow"') && textSample.includes('"nodes"'));
    let hasPrompt = (textSample.includes('"inputs"') && (textSample.includes('"class_type"') || textSample.includes('"text"'))) ||
                    textSample.includes('"client_id"') || textSample.includes('"extra_pnginfo"');
    const hasA1111 = textSample.includes("Negative prompt:") || textSample.includes("Steps: ");

    if (!promptDetails) {
      if (hasA1111) {
        const m = textSample.match(/([\s\S]+?)(Negative prompt:[\s\S]+?)(Steps:\s*\d+[\s\S]*)/);
        if (m) {
          promptDetails = parseA1111Parameters(m[0]);
        } else {
          const negIdx = textSample.indexOf("Negative prompt:");
          if (negIdx !== -1) {
            const start = Math.max(0, negIdx - 800);
            promptDetails = parseA1111Parameters(textSample.substring(start, negIdx + 800));
          }
        }
      }

      if (!promptDetails) {
        promptDetails = extractPromptsFromRawText(textSample);
      }
    }

    if (promptDetails && promptDetails.prompt) {
      hasPrompt = true;
    }

    if (hasWf) return { hasWorkflow: true, hasPrompt: true, hasA1111: false, type: "comfy_workflow", promptDetails };
    if (hasPrompt) return { hasWorkflow: false, hasPrompt: true, hasA1111: false, type: "comfy_prompt", promptDetails };
    if (hasA1111) return { hasWorkflow: false, hasPrompt: false, hasA1111: true, type: "a1111", promptDetails };
    if (promptDetails && promptDetails.prompt) return { hasWorkflow: false, hasPrompt: true, hasA1111: false, type: "ai_metadata", promptDetails };

  } catch (err) {
    console.warn("Metadata detection error:", err);
  }

  return { hasWorkflow: false, hasPrompt: Boolean(promptDetails?.prompt), hasA1111: false, type: promptDetails ? "comfy_prompt" : "none", promptDetails };
}

function createComfyBadgeHtml(file, result) {
  const meta = file.metaStatus;
  if (!meta) return '<div style="font-size: 10px; color: var(--muted); margin-top: 3px;">🔍 メタデータ解析中...</div>';

  const isConvertOn = enableConvertCheck?.checked ?? true;

  let badge = "";
  if (meta.hasWorkflow) {
    badge = `
      <span class="meta-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;" title="ComfyUIのワークフロー（ノード接続・配置情報）が完全な形で含まれています。ComfyUI画面にドロップすると完全再現可能です。">
        <span>🧬 ComfyUI ワークフロー完全内包</span>
        ${meta.nodeCount ? `<span style="font-size: 9.5px; opacity: 0.85;">(${meta.nodeCount}ノード)</span>` : ""}
      </span>
    `;
  } else if (meta.hasPrompt) {
    badge = `
      <span class="meta-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600;" title="ComfyUIのプロンプト/API情報が含まれています。">
        📝 ComfyUI プロンプト情報あり
      </span>
    `;
  } else if (meta.hasA1111) {
    badge = `
      <span class="meta-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 600;" title="WebUI (A1111) 生成パラメータが含まれています。">
        📋 WebUI (A1111) 生成情報あり
      </span>
    `;
  } else {
    badge = `
      <span class="meta-badge" style="background: rgba(255, 255, 255, 0.05); color: var(--muted); border: 1px solid var(--border); font-size: 10px; padding: 1px 5px; border-radius: 4px;" title="ワークフローメタデータは検出されませんでした（Exif削除済みまたは非AI画像）。">
        ⚪ ワークフローなし
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

  return `<div class="comfy-meta-row" style="margin-top: 3px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">${badge}${statusNotice}</div>`;
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

// 許可する拡張子一覧
const ALLOWED_EXT_LIST = new Set([
  // 画像
  "jpg", "jpeg", "png", "webp", "gif", "avif", "jxl", "bmp", "ico", "svg",
  // 動画
  "mp4", "webm", "ogv", "mov", "m4v", "avi",
  // 音声
  "mp3", "wav", "ogg", "m4a", "flac", "aac",
  // 圧縮アーカイブ
  "zip", "7z", "rar", "tar", "gz",
  // 文書・テキスト
  "pdf", "txt", "md", "json", "csv",
]);

// 危険な実行ファイル・スクリプト（明確に除外）
const BLOCKED_EXT_LIST = new Set([
  "exe", "bat", "cmd", "ps1", "sh", "msi", "com", "vbs", "html", "htm", "js", "mjs", "cjs", "php", "py"
]);

function isFileAcceptable(file) {
  const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  if (BLOCKED_EXT_LIST.has(ext)) return false;
  if (ALLOWED_EXT_LIST.has(ext)) return true;
  if (file.type && (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/"))) {
    return true;
  }
  return false;
}

function addFiles(files) {
  let blockedCount = 0;
  const allowed = files.filter((file) => {
    const ok = isFileAcceptable(file);
    if (!ok) blockedCount++;
    return ok;
  });

  if (blockedCount > 0) {
    alert(`⚠️ 実行ファイルやスクリプトなどの危険なファイル形式（${blockedCount}件）は除外されました。`);
  }

  state.files.push(...allowed);
  invalidateConversionCache();
  render();

  // 🧬 ファイル追加時に非同期で ComfyUI メタデータを自動解析（画像ファイルのみ）
  allowed.forEach(f => {
    const ext = f.name.includes(".") ? f.name.split(".").pop().toLowerCase() : "";
    const isImage = (f.type && f.type.startsWith("image/")) || ["jpg", "jpeg", "png", "webp", "avif", "jxl"].includes(ext);
    if (isImage) {
      detectComfyMetadata(f).then(meta => {
        f.metaStatus = meta;
        render();
      }).catch(err => {
        console.warn("Meta parse error:", err);
        f.metaStatus = { hasWorkflow: false, type: "none" };
        render();
      });
    } else {
      f.metaStatus = { hasWorkflow: false, type: "none" };
    }
  });
}

function setUiLock(locked) {
  const r2Ok = isR2Configured();
  const fbOk = isFilebaseConfigured();
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
  if (convertUploadR2Button) convertUploadR2Button.disabled = locked || !hasFiles || !r2Ok;
  if (convertUploadFilebaseButton) convertUploadFilebaseButton.disabled = locked || !hasFiles || !fbOk;
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
  const r2Ok = isR2Configured();
  const fbOk = isFilebaseConfigured();
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
  if (convertUploadR2Button) convertUploadR2Button.disabled = !hasFiles || !r2Ok;
  if (convertUploadFilebaseButton) convertUploadFilebaseButton.disabled = !hasFiles || !fbOk;

  if (dropzone) {
    dropzone.classList.toggle("has-files", hasFiles);
  }

  updateRenamePreview();

  if (fileList) {
    fileList.innerHTML = "";
    const lang = getAppLanguage();
    const dict = i18nDict[lang] || i18nDict.ja;

    state.files.forEach((file, index) => {
      try {
        const result = state.results[index];
        const item = document.createElement("article");
        item.className = "file-item unified-file-card";
        item.dataset.index = index;

        const originalExt = file.name ? file.name.split('.').pop().toLowerCase() : "";
        const targetExt = isConvertOn
          ? (extensions[formatSelect?.value || "image/webp"] || "webp")
          : originalExt;

        const isNonConverted = (!isConvertOn && originalExt === targetExt) || (result && !result.converted);

        let previewSrc = "";
        if (result && result.previewUrl) {
          previewSrc = result.previewUrl;
        } else if (file.type.startsWith("image/")) {
          previewSrc = URL.createObjectURL(file);
        }

        const displayName = result ? result.name : createOutputName(file.name, formatSelect?.value || "image/webp", index);

        let metaHtml = "";
        if (result && result.size) {
          const diff = file.size - result.size;
          const savedRate = file.size ? Math.round((diff / file.size) * 100) : 0;

          if (isNonConverted) {
            metaHtml = `${formatBytes(result.size)} · <span style="color: var(--muted);">${escapeHtml(dict.nonConverted || "非変換")}</span>`;
          } else {
            let rateText = "";
            if (savedRate > 0) {
              rateText = `<span style="color: #22c55e; font-weight: bold;">${savedRate}% 削減</span>`;
            } else if (savedRate < 0) {
              rateText = `<span style="color: #f87171; font-weight: bold;">${Math.abs(savedRate)}% 増加</span>`;
            } else {
              rateText = `<span style="color: var(--muted);">±0%</span>`;
            }
            metaHtml = `${formatBytes(file.size)} ➔ <strong style="color: #fff;">${formatBytes(result.size)}</strong> (${rateText})`;
          }
        } else {
          metaHtml = `${formatBytes(file.size)} · <span style="color: var(--muted);">${escapeHtml(dict.statusWaiting || "待機中")}</span>`;
        }

        const hasPromptDetails = Boolean(file.metaStatus?.promptDetails?.prompt);
        const promptBtnHtml = hasPromptDetails
          ? `<button type="button" class="ghost-button copy-prompt-btn" data-index="${index}" style="height: 28px; font-size: 11px; padding: 0 8px; color: #fbbf24; border-color: rgba(251, 191, 36, 0.4); display: inline-flex; align-items: center; gap: 3px;" title="AIプロンプトをコピー">📝 ${escapeHtml(dict.copyPrompt || "プロンプトコピー")}</button>`
          : "";

        item.innerHTML = `
          <div class="card-thumb-area">
            ${previewSrc ? `<img class="thumb" src="${previewSrc}" alt="" loading="lazy">` : `<div class="thumb format-badge">${escapeHtml(originalExt.toUpperCase() || "FILE")}</div>`}
          </div>
          <div class="card-main-area">
            <div class="card-title-row">
              <span class="file-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</span>
            </div>
            <div class="card-meta-row">
              ${metaHtml}
            </div>
            ${createComfyBadgeHtml(file, result)}
          </div>
          <div class="card-actions-area item-actions-col" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-left: auto;">
            ${promptBtnHtml}
            ${createCardActionHtml(file, result, index)}
            <button type="button" class="ghost-button delete-button danger-button" data-index="${index}" aria-label="削除" title="一覧から削除" style="min-width: 28px; height: 28px; padding: 0 6px; font-size: 14px; line-height: 1;">&times;</button>
          </div>
        `;
        fileList.append(item);
      } catch (err) {
        console.error("Card render error:", err);
      }
    });

    const totalPrompts = state.files.filter(f => f.metaStatus?.promptDetails?.prompt).length;
    if (copyAllPromptsBtn) {
      if (totalPrompts > 0) {
        copyAllPromptsBtn.style.display = "inline-flex";
        copyAllPromptsBtn.textContent = `📝 ${dict.copyAllPrompts || "プロンプト一括コピー"} (${totalPrompts})`;
      } else {
        copyAllPromptsBtn.style.display = "none";
      }
    }
  }
}

function createCardActionHtml(file, result, index) {
  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;

  const isConvertOn = enableConvertCheck?.checked ?? true;
  const isRenameOn = enableRenameCheck?.checked ?? true;
  const canProcessLocal = isConvertOn || isRenameOn;
  const r2Ok = isR2Configured();
  const fbOk = isFilebaseConfigured();
  const upOk = r2Ok || fbOk;

  const dlBtnDisabled = (!canProcessLocal && !result) ? "disabled" : "";
  const dlBtnTitle = (!canProcessLocal && !result)
    ? "変換・リネームが両方オフのためダウンロード無効"
    : "ダウンロード";

  if (result && result.isUploading) {
    const pName = result.uploadingProvider === "filebase" ? "IPFS" : "R2";
    return `<span class="status-text saving" style="font-size: 11px;">${pName} UP中...</span>`;
  }

  const currentProviderName = (activeStorageTab === "filebase" && fbOk) ? "Filebase (IPFS)" : (r2Ok ? "Cloudflare R2" : (fbOk ? "Filebase (IPFS)" : "ストレージ"));
  const upBtnTitle = upOk
    ? `このファイルだけ変換して${currentProviderName}へアップロード`
    : "ストレージ未設定のためアップロード不可";
  const upBtnStyle = upOk
    ? "font-size: 11px; padding: 0 8px; height: 28px;"
    : "opacity: 0.35; font-size: 11px; padding: 0 8px; height: 28px; cursor: not-allowed;";

  const currentName = result ? result.name : file.name;
  const ext = currentName.split('.').pop().toLowerCase();
  const isCivitaiSupported = ["jpg", "jpeg", "png", "webp", "mp4", "webm"].includes(ext);
  const isProtected = Boolean(file.hasPassword || result?.hasPassword);
  const civitaiOk = upOk && isCivitaiSupported && !isProtected;
  const civitaiStyle = civitaiOk
    ? "color: #38bdf8; border-color: rgba(56, 189, 248, 0.4); font-size: 11px; padding: 0 8px; height: 28px;"
    : "opacity: 0.35; font-size: 11px; padding: 0 8px; height: 28px; cursor: not-allowed;";
  let civitaiBtnTitle = "リネームを無視して変換・一時共有し、Civitaiの投稿画面を開く";
  if (!upOk) civitaiBtnTitle = "ストレージ未接続のためCivitai連携不可";
  else if (!isCivitaiSupported) civitaiBtnTitle = "Civitai非対応フォーマット";
  else if (isProtected) civitaiBtnTitle = "パスワード保護中のファイルはCivitai連携不可";

  if (result && result.isUploaded) {
    const isFb = result.uploadedProvider === "filebase";
    const badgeHtml = isFb
      ? `<span style="font-size: 9.5px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); padding: 1px 5px; border-radius: 4px;">🪐 IPFS</span>`
      : `<span style="font-size: 9.5px; font-weight: 700; color: #fb923c; background: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.4); padding: 1px 5px; border-radius: 4px;">⚡ R2</span>`;

    const pwdBadge = result.hasPassword
      ? `<span class="password-badge" style="font-size: 9.5px; font-weight: 600; color: #818cf8; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 1px 5px; border-radius: 4px;" title="合言葉: ${result.password ? escapeHtml(result.password) : '保護中'}">🔒 保護</span>`
      : "";

    return `
      ${badgeHtml}
      ${pwdBadge}
      <input type="text" class="url-output" value="${escapeHtml(result.proxyUrl)}" readonly style="width: 140px; font-size: 11px; height: 28px; padding: 0 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; border-radius: 4px;" title="クリックで全選択＆コピー" onclick="this.select()">
      <button type="button" class="ghost-button copy-button" style="font-size: 11px; padding: 0 8px; height: 28px;">${escapeHtml(dict.copyUrl || "コピー")}</button>
      <button type="button" class="ghost-button download-single-btn" data-index="${index}" style="font-size: 11px; padding: 0 8px; height: 28px;" title="${dlBtnTitle}" ${dlBtnDisabled}>📥 DL</button>
      ${!result.hasPassword ? `<button type="button" class="ghost-button civitai-post-btn" data-index="${index}" data-url="${escapeHtml(result.proxyUrl)}" data-name="${escapeHtml(result.name)}" style="${civitaiStyle}" title="${civitaiBtnTitle}" ${civitaiOk ? '' : 'disabled'}>🎨 Civitai</button>` : ""}
    `;
  }

  // 待機中または変換完了時（BYOCと完全一致: [📥 DL] [☁️ UP] [🎨 Civitai]）
  return `
    <button type="button" class="ghost-button download-single-btn" data-index="${index}" style="font-size: 11px; padding: 0 8px; height: 28px;" title="${dlBtnTitle}" ${dlBtnDisabled}>📥 DL</button>
    <button type="button" class="ghost-button upload-single-btn" data-index="${index}" style="${upBtnStyle}" title="${upBtnTitle}" ${upOk ? '' : 'disabled'}>☁️ UP</button>
    <button type="button" class="ghost-button civitai-post-btn" data-index="${index}" style="${civitaiStyle}" title="${civitaiBtnTitle}" ${civitaiOk ? '' : 'disabled'}>🎨 Civitai</button>
  `;
}

copyAllPromptsBtn?.addEventListener("click", async () => {
  const promptList = state.files
    .filter(f => f?.metaStatus?.promptDetails?.prompt)
    .map(f => {
      const p = f.metaStatus.promptDetails;
      let text = `【${f.name}】\n${p.prompt}`;
      if (p.negativePrompt) text += `\nNegative prompt: ${p.negativePrompt}`;
      if (p.params) text += `\n${p.params}`;
      return text;
    });
  if (promptList.length > 0) {
    const textToCopy = promptList.join("\n\n" + "=".repeat(30) + "\n\n");
    await copyToClipboard(textToCopy, copyAllPromptsBtn, "📋 全プロンプトコピー完了!");
  }
});

// ファイルリストイベント委譲
fileList?.addEventListener("click", async (event) => {
  const target = event.target;
  const card = target.closest(".unified-file-card");
  if (!card) return;

  const index = Number(target.dataset.index);

  // 0. プロンプト個別コピーボタン
  const promptBtn = target.closest(".copy-prompt-btn");
  if (promptBtn) {
    const idx = Number(promptBtn.dataset.index);
    const f = state.files[idx];
    const p = f?.metaStatus?.promptDetails;
    if (p && p.prompt) {
      let copyText = p.prompt;
      if (p.negativePrompt) copyText += `\nNegative prompt: ${p.negativePrompt}`;
      await copyToClipboard(copyText, promptBtn, "📋 コピー完了!");
    }
    return;
  }

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

  // 3. 単体アップロード (☁️ UP: BYOC準拠・選択中ストレージへ自動アップロード)
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
      const r2Ok = isR2Configured();
      const fbOk = isFilebaseConfigured();
      const targetProvider = (activeStorageTab === "filebase" && fbOk) ? "filebase" : (r2Ok ? "r2" : (fbOk ? "filebase" : "r2"));
      const success = await uploadImage(result, targetProvider);
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

  // 3.1 単体アップロード (⚡ R2)
  if (target.classList.contains("upload-r2-btn")) {
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
      const success = await uploadImage(result, "r2");
      if (success) {
        await fetchAndRenderR2Files();
      }
    } catch (e) {
      console.error(e);
      alert("R2 アップロードに失敗しました: " + e.message);
    } finally {
      render();
    }
    return;
  }

  // 3.1 単体アップロード (🪐 Filebase)
  if (target.classList.contains("upload-filebase-btn")) {
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
      const success = await uploadImage(result, "filebase");
      if (success) {
        await fetchAndRenderR2Files();
      }
    } catch (e) {
      console.error(e);
      alert("Filebase アップロードに失敗しました: " + e.message);
    } finally {
      render();
    }
    return;
  }

  // 3.5 Civitai 転送
  if (target.classList.contains("civitai-post-btn")) {
    if (isNaN(index) || index < 0 || index >= state.files.length) return;
    const file = state.files[index];
    let result = state.results[index];

    // すでにアップロード済みの場合は直接開く
    if (result && result.isUploaded && result.proxyUrl) {
      openCivitaiIntent(result.proxyUrl, result.name);
      return;
    }

    // 🛡️ ポップアップブロック回避：クリック直後に空タブを先行オープン
    let preloadWindow = null;
    try {
      preloadWindow = window.open("about:blank", "_blank");
      if (preloadWindow) {
        preloadWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><title>🎨 Civitai 転送準備中...</title></head>
          <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#f8fafc;text-align:center;padding:20px;">
            <div style="font-size:42px;margin-bottom:16px;">🎨</div>
            <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:700;">Civitai 転送準備中...</h2>
            <p style="margin:0;color:#94a3b8;font-size:14px;max-width:380px;line-height:1.5;">画像を高速変換＆アップロードしています。<br>完了後に自動で Civitai の投稿画面が開きます。</p>
          </body>
          </html>
        `);
      }
    } catch (e) {
      console.warn("Preload window failed:", e);
    }

    target.disabled = true;
    target.textContent = "転送準備中...";
    try {
      if (!result || !isConversionCacheValid()) {
        if (result && result.url) URL.revokeObjectURL(result.url);
        if (result && result.previewUrl) URL.revokeObjectURL(result.previewUrl);
        result = await convertImage(file, index);
        state.results[index] = result;
      }
      const targetProvider = isR2Configured() ? "r2" : "filebase";
      const success = await uploadImage(result, targetProvider);
      if (success && result.proxyUrl) {
        await fetchAndRenderR2Files();
        openCivitaiIntent(result.proxyUrl, result.name, preloadWindow);
      } else {
        if (preloadWindow && !preloadWindow.closed) preloadWindow.close();
      }
    } catch (e) {
      console.error(e);
      if (preloadWindow && !preloadWindow.closed) preloadWindow.close();
      alert("Civitai 転送準備に失敗しました: " + e.message);
    } finally {
      render();
    }
    return;
  }

  // 4. URL コピー
  if (target.classList.contains("copy-button")) {
    const result = state.results[index];
    const inputEl = card.querySelector(".url-output");
    let urlToCopy = result?.proxyUrl || inputEl?.value || "";

    // Filebase IPFS モードで URL に /i/ が抜けている場合は強制的に完全な直リンを再構築
    const provider = getStorageProvider();
    if (provider === "filebase" && result?.ipfsCid && !urlToCopy.includes("/i/")) {
      const baseDomain = (getSelectedR2Domain() || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
      urlToCopy = `${baseDomain}/i/${result.ipfsCid}/${encodeURIComponent(result.name)}`;
      if (inputEl) inputEl.value = urlToCopy;
      if (result) result.proxyUrl = urlToCopy;
    }

    if (inputEl) {
      inputEl.value = urlToCopy;
      inputEl.select();
    }
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

// 🪐 Filebase FIFO（先入れ先出し）自動容量解放
async function ensureStorageCapacityFilebase(s3, bucketName, requiredBytes = 0) {
  const isAutoFifo = localStorage.getItem("autoFifo") !== "false";
  if (!isAutoFifo || !s3 || !bucketName) return;

  // 上限サイズ (MB単位、デフォルト 5000MB = 5GB)
  const limitMb = Number(storageLimitRange?.value || localStorage.getItem("storageLimit") || "5000");
  const limitBytes = limitMb * 1024 * 1024;

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
    });
    const response = await s3.send(listCommand);
    const contents = response.Contents || [];
    if (contents.length === 0) return;

    let currentTotalBytes = contents.reduce((acc, cur) => acc + (cur.Size || 0), 0);

    // 新規ファイルを足しても上限の 95% 未満なら解放不要
    if (currentTotalBytes + requiredBytes <= limitBytes * 0.95) {
      return;
    }

    console.log(`🪐 Filebase FIFO 発動: 現在容量 ${formatBytes(currentTotalBytes)} + 新規 ${formatBytes(requiredBytes)} > 上限 ${formatBytes(limitBytes)} (95%)`);

    // 保護対象（pinned_ で始まるもの）を除外し、古い順（LastModified 昇順）にソート
    const eligibleFiles = contents.filter(item => {
      if (item.Key?.startsWith("pinned_")) return false; // 📌永続化は保護
      return true;
    }).sort((a, b) => new Date(a.LastModified || 0) - new Date(b.LastModified || 0));

    const filesToUnpin = [];
    let freedBytes = 0;

    for (const file of eligibleFiles) {
      filesToUnpin.push(file.Key);
      freedBytes += (file.Size || 0);
      currentTotalBytes -= (file.Size || 0);

      // 十分な空き容量（上限の90%以下）が確保できたら終了
      if (currentTotalBytes + requiredBytes <= limitBytes * 0.90) {
        break;
      }
    }

    if (filesToUnpin.length > 0) {
      console.log(`🪐 Filebase FIFO 自動アンピン実行: ${filesToUnpin.join(", ")} (${formatBytes(freedBytes)} 解放)`);
      if (filesToUnpin.length === 1) {
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: filesToUnpin[0],
        }));
      } else {
        await s3.send(new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: filesToUnpin.map(k => ({ Key: k })) },
        }));
      }
    }
  } catch (err) {
    console.warn("Filebase FIFO ensureStorageCapacity error:", err);
  }
}

// --- S3 アップロード処理 (R2 / Filebase 独立対応) ---
async function uploadImage(result, targetProvider = "r2") {
  if (!result || !result.blob) return false;

  const isFilebase = targetProvider === "filebase";
  const s3 = getS3Client(targetProvider);
  const bucketName = getBucketName(targetProvider);

  if (!s3 || !bucketName) {
    alert(`⚠️ ${isFilebase ? "Filebase" : "R2"} 接続設定を完了してください`);
    return false;
  }

  result.isUploading = true;
  result.uploadingProvider = targetProvider;
  render();

  try {
    const pwdInput = document.querySelector("#tempPasswordInput");
    const password = customPassword !== null ? customPassword : (pwdInput ? pwdInput.value.trim() : "");

    const arrayBuffer = await result.blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let contentType = result.blob.type || "";
    if (!contentType || contentType === "application/octet-stream") {
      contentType = getContentTypeFromFilename(result.name);
    }

    const ext = result.name ? result.name.split('.').pop().toLowerCase() : "";
    const isAttachment = ["zip", "7z", "rar", "tar", "gz"].includes(ext);
    const contentDisposition = isAttachment
      ? `attachment; filename="${encodeURIComponent(result.name)}"`
      : "inline";

    // 🪐 Filebase (IPFS): 容量上限に近づいている場合、最も古い実体を自動アンピン (FIFO)
    if (isFilebase) {
      await ensureStorageCapacityFilebase(s3, bucketName, bytes.length);
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: result.name,
      Body: bytes,
      ContentType: contentType,
      ContentDisposition: contentDisposition,
      Metadata: {
        size: String(result.size || bytes.length),
      },
    });

    const putOutput = await s3.send(command);

    let ipfsCid = null;
    if (isFilebase) {
      // PutObject レスポンスヘッダーから CID を探索
      const headers = putOutput?.$metadata?.httpHeaders || {};
      ipfsCid = headers["x-amz-meta-cid"] || headers["x-amz-meta-ipfs-hash"];

      // レスポンスヘッダーに無ければ HeadObject を試行
      if (!ipfsCid) {
        try {
          const headOutput = await s3.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: result.name,
          }));
          const hHeaders = headOutput?.$metadata?.httpHeaders || {};
          ipfsCid = hHeaders["x-amz-meta-cid"] ||
                    hHeaders["x-amz-meta-ipfs-hash"] ||
                    headOutput?.Metadata?.cid ||
                    headOutput?.Metadata?.["ipfs-hash"];
        } catch (hErr) {
          console.warn("HeadObject CID lookup fallback failed:", hErr);
        }
      }
    }

    result.isUploaded = true;
    result.uploadedProvider = targetProvider;
    result.storageKey = result.name;
    result.password = password;
    result.hasPassword = Boolean(password);

    if (isFilebase) {
      if (ipfsCid) {
        result.ipfsCid = ipfsCid;
        storeIpfsCid(result.name, ipfsCid);
        registerKvCid(result.name, ipfsCid, result.size || bytes.length, contentType, result.name, password);
      }
      const baseDomain = (getSelectedR2Domain() || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
      result.proxyUrl = `${baseDomain}/${encodeURIComponent(result.name)}`;
      console.log(`🪐 Filebase URL 生成完了 (KV連携): CID=${ipfsCid} -> ${result.proxyUrl}`);
    } else {
      result.proxyUrl = getPublicUrl(result.name);
    }

    paletteFiles.unshift({ key: result.name, url: result.proxyUrl });
    renderUrlPalette();

    return true;
  } catch (error) {
    result.error = error.message;
    console.error("Upload failed:", error);
    alert(`アップロード失敗 (${targetProvider}): ${error.message}`);
    return false;
  } finally {
    result.isUploading = false;
    render();
  }
}

// --- 一括アップロード共通処理 ---
async function handleBatchUpload(targetProvider) {
  if (!state.files.length) return;
  const success = await runConversion();
  if (!success) return;

  const targets = state.results.filter(r => r && !r.isUploaded && !r.isUploading);
  if (targets.length === 0) return;

  setUiLock(true);
  const providerLabel = targetProvider === "filebase" ? "Filebase" : "R2";
  if (statusText) {
    statusText.className = "status-text saving";
    statusText.textContent = `${providerLabel} アップロード中 (0/${targets.length})`;
  }
  if (progressBar) progressBar.value = 0;

  try {
    for (let i = 0; i < targets.length; i++) {
      const result = targets[i];
      if (statusText) statusText.textContent = `${providerLabel} アップロード中 (${i + 1}/${targets.length})`;
      await uploadImage(result, targetProvider);
      if (progressBar) progressBar.value = Math.round(((i + 1) / targets.length) * 100);
    }
    if (statusText) {
      statusText.textContent = `${providerLabel} 一括アップロード完了`;
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
}

convertUploadR2Button?.addEventListener("click", () => handleBatchUpload("r2"));
convertUploadFilebaseButton?.addEventListener("click", () => handleBatchUpload("filebase"));

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

// --- R2 / Filebase ストレージ一覧 & タブ管理 ---
function updateStorageTabsUi() {
  if (storageTabR2 && storageTabFilebase) {
    if (activeStorageTab === "filebase") {
      storageTabFilebase.style.border = "1px solid #38bdf8";
      storageTabFilebase.style.background = "rgba(56, 189, 248, 0.15)";
      storageTabFilebase.style.color = "#38bdf8";
      storageTabFilebase.style.fontWeight = "700";

      storageTabR2.style.border = "1px solid var(--border)";
      storageTabR2.style.background = "rgba(255, 255, 255, 0.04)";
      storageTabR2.style.color = "var(--muted)";
      storageTabR2.style.fontWeight = "600";
    } else {
      storageTabR2.style.border = "1px solid #f97316";
      storageTabR2.style.background = "rgba(249, 115, 22, 0.15)";
      storageTabR2.style.color = "#fb923c";
      storageTabR2.style.fontWeight = "700";

      storageTabFilebase.style.border = "1px solid var(--border)";
      storageTabFilebase.style.background = "rgba(255, 255, 255, 0.04)";
      storageTabFilebase.style.color = "var(--muted)";
      storageTabFilebase.style.fontWeight = "600";
    }
  }
}

storageTabR2?.addEventListener("click", () => {
  activeStorageTab = "r2";
  localStorage.setItem("activeStorageTab", "r2");
  updateStorageTabsUi();
  fetchAndRenderR2Files();
});

storageTabFilebase?.addEventListener("click", () => {
  activeStorageTab = "filebase";
  localStorage.setItem("activeStorageTab", "filebase");
  updateStorageTabsUi();
  fetchAndRenderR2Files();
});

reloadR2FilesButton?.addEventListener("click", fetchAndRenderR2Files);

async function fetchAndRenderR2Files() {
  if (!r2FileList) return;
  updateStorageTabsUi();

  const lang = getAppLanguage();
  const dict = i18nDict[lang] || i18nDict.ja;
  const isFilebase = activeStorageTab === "filebase";
  const s3 = getS3Client(activeStorageTab);
  const bucketName = getBucketName(activeStorageTab);
  const providerLabel = isFilebase ? "Filebase (IPFS)" : "Cloudflare R2";

  if (!s3 || !bucketName) {
    const emptyNotice = isFilebase
      ? "🪐 Filebase (IPFS) の接続設定を行ってください。"
      : escapeHtml(dict.noFilesR2);
    r2FileList.innerHTML = `<span class="item-meta" style="padding: 18px; color: var(--muted); display: block; text-align: center;">${emptyNotice}</span>`;
    state.r2TotalSize = 0;
    updateStorageUsageUI();
    return;
  }

  r2FileList.innerHTML = `<span class="status-text saving" style="padding: 18px; display: block;">${providerLabel} ファイル一覧を取得中...</span>`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
    });
    const response = await s3.send(command);
    let contents = [];
    const baseDomain = (getSelectedR2Domain() || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");

    if (isFilebase) {
      // 🪐 Filebase (IPFS) モード: S3実体とKV名札をスマートマッチング
      const s3RawList = (response.Contents || []).map(item => ({
        Key: item.Key,
        Size: item.Size || 0,
        LastModified: item.LastModified,
      }));

      const s3KeyToItem = new Map();
      const s3CidToItem = new Map();
      for (const s3Item of s3RawList) {
        s3KeyToItem.set(s3Item.Key, s3Item);
        const cid = getStoredIpfsCid(s3Item.Key);
        if (cid) s3CidToItem.set(cid, s3Item);
      }

      let kvFiles = [];
      try {
        kvFiles = await fetchKvFiles();
      } catch (kvErr) {
        console.warn("fetchKvFiles merge error:", kvErr);
      }

      // KV アイテムの CID 補完と S3 実体キーの紐付け学習
      for (const kvItem of kvFiles) {
        if (!kvItem.metadata) kvItem.metadata = {};
        if (!kvItem.metadata.cid) {
          kvItem.metadata.cid = getStoredIpfsCid(kvItem.name);
        }
        const recordedS3Key = kvItem.metadata.s3Key;
        const cid = kvItem.metadata.cid;
        if (recordedS3Key && cid) {
          storeIpfsCid(recordedS3Key, cid);
          if (s3KeyToItem.has(recordedS3Key)) {
            s3CidToItem.set(cid, s3KeyToItem.get(recordedS3Key));
          }
        }
      }

      // S3 に1ファイルのみ存在し、KVエントリがある場合の自動補完
      if (s3RawList.length === 1 && kvFiles.length > 0) {
        const soleS3 = s3RawList[0];
        const latestKv = kvFiles[0];
        const cid = latestKv.metadata?.cid || getStoredIpfsCid(latestKv.name);
        if (cid) {
          storeIpfsCid(soleS3.Key, cid);
          s3CidToItem.set(cid, soleS3);
        }
      }

      const consumedS3Keys = new Set();

      // 1. KV に登録されている名前（公開URL名）を最優先でリスト構築
      for (const kvItem of kvFiles) {
        const kvName = kvItem.name;
        const kvCid = kvItem.metadata?.cid || getStoredIpfsCid(kvName);
        const recordedS3Key = kvItem.metadata?.s3Key;

        let matchedS3 = null;
        if (recordedS3Key && s3KeyToItem.has(recordedS3Key)) {
          matchedS3 = s3KeyToItem.get(recordedS3Key);
        } else if (s3KeyToItem.has(kvName)) {
          matchedS3 = s3KeyToItem.get(kvName);
        } else if (kvCid && s3CidToItem.has(kvCid)) {
          matchedS3 = s3CidToItem.get(kvCid);
        }

        if (matchedS3) {
          consumedS3Keys.add(matchedS3.Key);
          contents.push({
            Key: kvName,
            s3Key: matchedS3.Key,
            Size: matchedS3.Size || kvItem.metadata?.size || 0,
            LastModified: matchedS3.LastModified || (kvItem.metadata?.lastModified ? new Date(kvItem.metadata.lastModified) : null),
            isFromS3: true,
            cid: kvCid || getStoredIpfsCid(matchedS3.Key),
          });
          if (kvCid) {
            storeIpfsCid(kvName, kvCid);
            storeIpfsCid(matchedS3.Key, kvCid);
          }
        } else {
          // S3 に実体がない（アンピン後など）
          contents.push({
            Key: kvName,
            s3Key: null,
            Size: kvItem.metadata?.size || 0,
            LastModified: kvItem.metadata?.lastModified ? new Date(kvItem.metadata.lastModified) : null,
            isFromS3: false,
            cid: kvCid,
          });
          if (kvCid) storeIpfsCid(kvName, kvCid);
        }
      }

      // 2. S3 にあるが KV に未登録のアイテムを追加
      for (const s3Item of s3RawList) {
        if (!consumedS3Keys.has(s3Item.Key)) {
          contents.push({
            Key: s3Item.Key,
            s3Key: s3Item.Key,
            Size: s3Item.Size || 0,
            LastModified: s3Item.LastModified,
            isFromS3: true,
            cid: getStoredIpfsCid(s3Item.Key),
          });
        }
      }
    } else {
      // ⚡ Cloudflare R2 モード（直接 S3 のみ）
      contents = (response.Contents || []).map(item => ({
        Key: item.Key,
        s3Key: item.Key,
        Size: item.Size || 0,
        LastModified: item.LastModified,
        isFromS3: true,
      }));
    }

    // 自動クリーンアップチェック (7日以上経過したファイルを削除)
    const isAutoCleanup = localStorage.getItem("autoCleanup") === "true";
    if (isAutoCleanup && contents.length > 0) {
      const now = new Date();
      const oldKeys = contents.filter(item => {
        if (!item.isFromS3) return false;
        if (item.Key?.startsWith("pinned_")) return false; // 📌永続化は保護
        if (!item.LastModified) return false;
        const diffDays = (now - new Date(item.LastModified)) / (1000 * 60 * 60 * 24);
        return diffDays >= 7;
      }).map(item => ({ Key: item.s3Key || item.Key }));

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

    // Filebase FIFO 自動容量解放チェック (一覧更新時に現在容量が上限を超えている場合)
    const isAutoFifo = localStorage.getItem("autoFifo") !== "false";
    if (isFilebase && isAutoFifo && contents.length > 0) {
      const limitMb = Number(storageLimitRange?.value || localStorage.getItem("storageLimit") || "5000");
      const limitBytes = limitMb * 1024 * 1024;
      const currentOriginBytes = contents.filter(c => c.isFromS3).reduce((acc, cur) => acc + (cur.Size || 0), 0);
      if (currentOriginBytes > limitBytes) {
        await ensureStorageCapacityFilebase(s3, bucketName, 0);
      }
    }

    paletteFiles = contents.map(item => ({
      key: item.Key,
      url: isFilebase ? `${baseDomain}/${encodeURIComponent(item.Key)}` : getPublicUrl(item.Key),
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

    // 使用容量は Filebase / S3 に実体があるもののみカウント（アンピン済みは容量 0）
    state.r2TotalSize = contents.filter(c => c.isFromS3).reduce((acc, cur) => acc + (cur.Size || 0), 0);
    updateStorageUsageUI();

    contents.forEach(item => {
      const article = document.createElement("article");
      article.className = "result-item";
      const ext = item.Key ? item.Key.split('.').pop().toLowerCase() : "";
      const isVideo = ["mp4", "webm", "ogv", "mov", "m4v"].includes(ext);
      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext);
      
      const itemCid = isFilebase ? (item.cid || getStoredIpfsCid(item.Key) || (item.s3Key ? getStoredIpfsCid(item.s3Key) : null)) : null;

      article.dataset.key = item.Key || "";
      article.dataset.s3key = item.s3Key || item.Key || "";
      article.dataset.size = String(item.Size || 0);
      article.dataset.cid = itemCid || "";

      let publicUrl = isFilebase
        ? `${baseDomain}/${encodeURIComponent(item.Key)}`
        : getPublicUrl(item.Key);
      const devUrl = isFilebase ? null : getDevUrl(item.Key);

      let thumbHtml = "";
      if (isImage) {
        thumbHtml = `<img class="thumb" alt="" src="${escapeHtml(publicUrl)}" loading="lazy">`;
      } else if (isVideo) {
        thumbHtml = `<video class="thumb" src="${escapeHtml(publicUrl)}#t=0.5" preload="metadata" muted playsinline style="object-fit: cover; pointer-events: none;"></video>`;
      } else {
        thumbHtml = `<div class="thumb format-badge">${escapeHtml(ext.toUpperCase() || "FILE")}</div>`;
      }

      const dateStr = item.LastModified ? new Date(item.LastModified).toLocaleDateString() : "";

      // ステータスバッジとアクションボタン
      let statusBadgeHtml = "";
      let actionButtonsHtml = "";

      const hasPassword = Boolean(item.password || item.metadata?.passwordHash || item.metadata?.password);
      const plainPwd = item.password || item.metadata?.password;
      const pwdBadgeHtml = hasPassword
        ? `<span class="password-badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600;">🔒 ${plainPwd ? `パスワード: ${escapeHtml(plainPwd)}` : "パスワード保護"}</span>`
        : "";

      if (isFilebase) {
        if (item.isFromS3) {
          statusBadgeHtml = `<span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.4);" title="Filebase オリジンに保存中（ストレージ容量を消費中）">⚡ オリジン保存中</span>`;
          actionButtonsHtml = `
            <button type="button" class="ghost-button copy-r2-url-btn" data-url="${escapeHtml(publicUrl)}">${escapeHtml(dict.copyUrl)}</button>
            ${!hasPassword ? `<button type="button" class="ghost-button civitai-r2-post-btn" data-url="${escapeHtml(publicUrl)}" data-name="${escapeHtml(item.Key)}" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);" title="Civitai の投稿画面を開く">🎨 Civitai</button>` : ""}
            <button type="button" class="ghost-button unpin-file-btn" data-key="${escapeHtml(item.Key)}" data-s3key="${escapeHtml(item.s3Key || item.Key)}" style="color: #f59e0b; border-color: rgba(245,158,11,0.4);" title="Filebaseの容量を解放します（URLリンクはそのまま使えます）">容量解放</button>
            <button type="button" class="ghost-button danger-button delete-r2-file-btn" data-key="${escapeHtml(item.Key)}" data-s3key="${escapeHtml(item.s3Key || item.Key)}" data-origin="1" title="アクセスを遮断し、KVおよびストレージから完全に削除します">リンク抹消</button>
          `;
        } else {
          statusBadgeHtml = `<span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 600;" title="オリジンから削除済み。IPFS/CDNキャッシュにより一時的に表示されていますが、永続性は保証されません。">⚠️ IPFS残留中 (非保証)</span>`;
          actionButtonsHtml = `
            <button type="button" class="ghost-button copy-r2-url-btn" data-url="${escapeHtml(publicUrl)}">${escapeHtml(dict.copyUrl)}</button>
            ${!hasPassword ? `<button type="button" class="ghost-button civitai-r2-post-btn" data-url="${escapeHtml(publicUrl)}" data-name="${escapeHtml(item.Key)}" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);" title="Civitai の投稿画面を開く">🎨 Civitai</button>` : ""}
            <button type="button" class="ghost-button danger-button delete-r2-file-btn" data-key="${escapeHtml(item.Key)}" data-s3key="${escapeHtml(item.s3Key || item.Key)}" data-origin="0" title="アクセスを遮断し、KVから完全に削除します">リンク抹消</button>
          `;
        }
      } else {
        actionButtonsHtml = `
          <button type="button" class="ghost-button copy-r2-url-btn" data-url="${escapeHtml(publicUrl)}">${escapeHtml(dict.copyUrl)}</button>
          ${!hasPassword ? `<button type="button" class="ghost-button civitai-r2-post-btn" data-url="${escapeHtml(publicUrl)}" data-name="${escapeHtml(item.Key)}" style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);" title="Civitai の投稿画面を開く">🎨 Civitai</button>` : ""}
          ${devUrl ? `<button type="button" class="ghost-button copy-r2-dev-url-btn" data-url="${escapeHtml(devUrl)}">${escapeHtml(dict.devCopyUrl)}</button>` : ""}
          <button type="button" class="ghost-button danger-button delete-r2-file-btn" data-key="${escapeHtml(item.Key)}" data-origin="1">${escapeHtml(dict.deleteNow)}</button>
        `;
      }

      const renameBtnHtml = isFilebase
        ? `<button type="button" class="rename-file-btn" data-key="${escapeHtml(item.Key)}" data-s3key="${escapeHtml(item.s3Key || item.Key)}" data-size="${item.Size || 0}" data-cid="${escapeHtml(itemCid || "")}" title="ファイル名を変更" style="background: none; border: none; cursor: pointer; padding: 2px 4px; font-size: 14px; opacity: 0.8; transition: opacity 0.15s; line-height: 1;">✏️</button>`
        : "";

      article.innerHTML = `
        <input type="checkbox" class="r2-file-checkbox" data-key="${escapeHtml(item.Key)}" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); align-self: center; margin-right: 4px;">
        <a href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener noreferrer" class="thumb-link" title="表示">
          ${thumbHtml}
        </a>
        <div style="flex: 1; min-width: 0;">
          <div class="item-name-row" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="item-name" style="font-weight: 600; word-break: break-all;">${escapeHtml(item.Key)}</span>
            ${renameBtnHtml}
            <span style="color: #64748b; font-size: 11px; white-space: nowrap;">${formatBytes(item.Size || 0)}</span>
            ${statusBadgeHtml}
            ${pwdBadgeHtml}
            <span class="r2-wf-badge-placeholder" data-key="${escapeHtml(item.Key)}"></span>
          </div>
          <div class="item-meta" style="color: var(--muted); margin-top: 4px; font-size: 11px;">
            更新日: ${escapeHtml(dateStr)}
          </div>
        </div>
        <div class="result-actions" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          ${actionButtonsHtml}
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
    console.error("Storage fetch error:", error);
    r2FileList.innerHTML = `<span class="item-meta error" style="padding: 18px; color: var(--danger); display: block; text-align: center;">通信エラー: ${escapeHtml(error.message)}</span>`;
  }
}

// ストレージファイル操作イベント委譲
r2FileList?.addEventListener("click", async (e) => {
  const target = e.target;
  const isFilebase = activeStorageTab === "filebase";
  const s3 = getS3Client(activeStorageTab);
  const bucketName = getBucketName(activeStorageTab);

  if (target.classList.contains("copy-r2-url-btn")) {
    let url = target.dataset.url;
    const article = target.closest(".result-item");
    const key = article?.dataset?.key;
    const baseDomain = (getSelectedR2Domain() || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");

    if (isFilebase && key) {
      url = `${baseDomain}/${encodeURIComponent(key)}`;
      target.dataset.url = url;

      // KV に登録済みか確認し、未登録なら裏で同期
      const cachedCid = getStoredIpfsCid(key);
      const s3Key = article?.dataset?.s3key || key;
      if (cachedCid) {
        registerKvCid(key, cachedCid, 0, "", s3Key);
      } else if (s3 && bucketName) {
        s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: s3Key })).then(headOutput => {
          const hHeaders = headOutput?.$metadata?.httpHeaders || {};
          const fetchedCid = hHeaders["x-amz-meta-cid"] ||
                             hHeaders["x-amz-meta-ipfs-hash"] ||
                             headOutput?.Metadata?.cid ||
                             headOutput?.Metadata?.["ipfs-hash"];
          if (fetchedCid) {
            storeIpfsCid(key, fetchedCid);
            storeIpfsCid(s3Key, fetchedCid);
          }
        }).catch(err => console.warn("Background CID lookup failed:", err));
      }
    }

    await copyToClipboard(url, target);
    return;
  }

  // 🪐 ファイル名（URL）変更（インライン編集: byoc スタイル）
  if (target.classList.contains("rename-file-btn") || target.closest(".rename-file-btn")) {
    const btn = target.classList.contains("rename-file-btn") ? target : target.closest(".rename-file-btn");
    const oldKey = btn.dataset.key;
    if (!oldKey) return;

    const row = btn.closest(".item-name-row");
    if (!row) return;

    const article = btn.closest(".result-item");
    const originalS3Key = btn.dataset.s3key || article?.dataset?.s3key || oldKey;

    const lastDotIndex = oldKey.lastIndexOf(".");
    const baseName = lastDotIndex > 0 ? oldKey.substring(0, lastDotIndex) : oldKey;
    const ext = lastDotIndex > 0 ? oldKey.substring(lastDotIndex) : "";

    const originalHtml = row.innerHTML;

    row.innerHTML = `
      <div class="rename-inline-form" style="display: flex; align-items: center; gap: 6px; flex: 1; flex-wrap: wrap;">
        <input type="text" class="rename-input" value="${escapeHtml(baseName)}" style="flex: 1; min-width: 120px; height: 28px; border: 1px solid var(--border); border-radius: 4px; background: rgba(0,0,0,0.4); color: var(--text); padding: 0 8px; font-size: 12px; outline: none;">
        <span class="rename-ext" style="font-size: 12px; color: var(--muted); font-weight: bold;">${escapeHtml(ext)}</span>
        <button type="button" class="primary-button rename-save-btn" data-key="${escapeHtml(oldKey)}" style="min-height: 28px; padding: 0 10px; font-size: 11.5px; font-weight: bold;">保存</button>
        <button type="button" class="ghost-button rename-cancel-btn" style="min-height: 28px; padding: 0 10px; font-size: 11.5px;">戻る</button>
      </div>
    `;

    const input = row.querySelector(".rename-input");
    const saveBtn = row.querySelector(".rename-save-btn");
    const cancelBtn = row.querySelector(".rename-cancel-btn");

    if (input) {
      input.focus();
      input.select();

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveBtn?.click();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelBtn?.click();
        }
      });
    }

    cancelBtn?.addEventListener("click", () => {
      row.innerHTML = originalHtml;
    });

    saveBtn?.addEventListener("click", async () => {
      const newBaseName = input?.value?.trim()?.replace(/[\\/:*?"<>|]/g, "-");
      if (!newBaseName || newBaseName === baseName) {
        row.innerHTML = originalHtml;
        return;
      }

      const newKey = ext ? `${newBaseName}${ext}` : newBaseName;

      const currentSize = parseInt(btn.dataset.size || article?.dataset?.size || "0", 10);
      let cid = btn.dataset.cid || article?.dataset?.cid || getStoredIpfsCid(oldKey) || getStoredIpfsCid(originalS3Key);
      let size = currentSize;
      let mime = "";

      try {
        const kvFiles = await fetchKvFiles();
        const currentKv = kvFiles.find(f => f.name === oldKey);
        if (currentKv) {
          if (!cid) cid = currentKv.metadata?.cid;
          if (!size) size = currentKv.metadata?.size || 0;
          mime = currentKv.metadata?.mime || "";
        }
      } catch (err) {
        console.warn("KV fetch error during rename:", err);
      }

      if (!cid) {
        alert("⚠️ このファイルの CID が見つからないためリネームできません。");
        row.innerHTML = originalHtml;
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "...";

      try {
        // 1. 新キーで登録（実体 S3 キー名 originalS3Key を引き継ぐ）
        await registerKvCid(newKey, cid, size, mime, originalS3Key);
        storeIpfsCid(newKey, cid);
        storeIpfsCid(originalS3Key, cid);

        // 2. 旧キーを KV から削除（KVの旧エイリアスを消す。S3実体オブジェクトは消さない）
        await deleteKvCid(oldKey);
        try {
          const map = JSON.parse(localStorage.getItem("ipfsCidMap") || "{}");
          if (oldKey !== originalS3Key) {
            delete map[oldKey];
          }
          map[originalS3Key] = cid;
          map[newKey] = cid;
          localStorage.setItem("ipfsCidMap", JSON.stringify(map));
        } catch (e) {}

        await fetchAndRenderR2Files();
      } catch (err) {
        console.error("Rename failed:", err);
        alert(`❌ リネームに失敗しました: ${err.message}`);
        row.innerHTML = originalHtml;
      }
    });

    return;
  }

  if (target.classList.contains("copy-r2-dev-url-btn")) {
    const url = target.dataset.url;
    await copyToClipboard(url, target);
    return;
  }

  if (target.classList.contains("civitai-r2-post-btn")) {
    const url = target.dataset.url;
    const name = target.dataset.name;
    openCivitaiIntent(url, name);
    return;
  }

  // ⚡ 容量解放（アンピン）：Filebase S3 からのみ削除し、KVとURLは維持
  if (target.classList.contains("unpin-file-btn")) {
    const key = target.dataset.key;
    const s3Key = target.dataset.s3key || key;
    if (!key || !confirm(`ファイル '${key}' を Filebase から削除して容量を解放しますか？\n\n・Filebase のストレージ容量が 0 になります（無料枠節約）。\n・IPFS/CDNキャッシュにより一時的に『残留』しますが、永続性は保証されません。`)) return;

    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });
      await s3.send(command);
      await fetchAndRenderR2Files();
    } catch (err) {
      alert(`容量解放に失敗しました: ${err.message}`);
    }
    return;
  }

  // 🚫 リンク抹消（完全削除）：KV から削除して即座に 404 化し、S3 にあればそれも削除
  if (target.classList.contains("delete-r2-file-btn")) {
    const key = target.dataset.key;
    const s3Key = target.dataset.s3key || key;
    const isFromOrigin = target.dataset.origin === "1";

    const confirmMsg = isFilebase
      ? `ファイル '${key}' へのアクセスを完全に遮断しますか？\n\n・Cloudflare KV からマッピングを削除します。\n・URL は即座に 404 になり、第三者が閲覧できなくなります。`
      : `ファイル '${key}' を R2 から削除しますか？`;

    if (!key || !confirm(confirmMsg)) return;

    try {
      if (isFilebase) {
        await deleteKvCid(key);
      }
      if (isFromOrigin && s3 && bucketName && s3Key) {
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
        });
        await s3.send(command);
      }
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

  const isFilebase = activeStorageTab === "filebase";
  const providerLabel = isFilebase ? "Filebase / KV" : "R2";

  if (!confirm(`選択した ${checkboxes.length} 件のファイルを ${providerLabel} から削除しますか？`)) return;

  const s3 = getS3Client(activeStorageTab);
  const bucketName = getBucketName(activeStorageTab);
  const keys = checkboxes.map(cb => cb.dataset.key);

  try {
    if (isFilebase) {
      for (const key of keys) {
        await deleteKvCid(key);
      }
    }
    if (s3 && bucketName) {
      const objects = keys.map(Key => ({ Key }));
      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objects },
      });
      await s3.send(command);
    }
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
function openCivitaiIntent(mediaUrl, title = "", existingWindow = null) {
  if (!mediaUrl) return;
  const intentUrl = `https://civitai.com/intent/post?mediaUrl=${encodeURIComponent(mediaUrl)}${title ? `&title=${encodeURIComponent(title)}` : ""}`;
  if (existingWindow && !existingWindow.closed) {
    try {
      existingWindow.location.href = intentUrl;
      return;
    } catch (e) {
      console.warn("Failed to redirect existing window:", e);
    }
  }
  window.open(intentUrl, "_blank", "noopener,noreferrer");
}
async function copyToClipboard(text, button = null) {
  if (!text) return;
  let copied = false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch (err) {
    console.warn("navigator.clipboard failed, trying execCommand fallback:", err);
  }

  if (!copied) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (fallbackErr) {
      console.error("execCommand copy failed:", fallbackErr);
    }
  }

  if (button) {
    const orig = button.textContent;
    button.textContent = copied ? "コピー完了!" : "コピー失敗";
    button.classList.add(copied ? "good" : "danger-button");
    setTimeout(() => {
      button.textContent = orig;
      button.classList.remove("good", "danger-button");
    }, 1500);
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
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = units.shift();
  while (value >= 1024 && units.length) {
    value /= 1024;
    unit = units.shift();
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
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
  const creatorTag = target.closest(".civitai-creator-tag");
  if (creatorTag) {
    const user = creatorTag.dataset.username;
    if (user && civitaiUserSelect) {
      civitaiUserSelect.value = user;
      localStorage.setItem("civitaiUsername", user);
      updateCivitaiStatus();
      renderCivitaiUserSelect();
      fetchAndRenderCivitaiGallery();
    }
    return;
  }

  const promptBtn = target.closest(".civitai-prompt-btn");
  if (promptBtn) {
    const id = promptBtn.dataset.id;
    const promptText = civitaiPromptsMap[id];
    if (promptText) {
      await copyToClipboard(promptText, promptBtn, "📋 コピー完了!");
    }
    return;
  }

  const copyBtn = target.closest(".civitai-copy-btn");
  if (copyBtn) {
    const rawUrl = copyBtn.dataset.url;
    if (!rawUrl) return;

    try {
      copyBtn.textContent = "解決中...";
      let finalUrl = rawUrl;
      try {
        const res = await fetch(rawUrl);
        if (res && res.url) finalUrl = res.url;
      } catch (e) {
        // CORS等で直接fetchできない場合はそのままrawUrlを使用
      }

      copyBtn.dataset.url = finalUrl;
      await copyToClipboard(finalUrl, copyBtn, "📋 URLコピー");
    } catch (err) {
      console.warn("Failed to copy civitai url:", err);
      await copyToClipboard(rawUrl, copyBtn, "📋 URLコピー");
    }
  }
});

// --- 🚀 外部投稿 / Windows「送る」連携ロジック ---
const dedicatedUploadApiUrlInput = document.querySelector("#dedicatedUploadApiUrl");
const copyUploadApiUrlBtn = document.querySelector("#copyUploadApiUrlBtn");
const copyCurlCmdBtn = document.querySelector("#copyCurlCmdBtn");
const downloadSendToBatBtn = document.querySelector("#downloadSendToBatBtn");

function getDedicatedUploadUrlWithDomain() {
  const baseDomain = (getSelectedR2Domain() || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  return `${baseDomain}/api/upload`;
}

function updateDedicatedUploadApiUI() {
  if (!dedicatedUploadApiUrlInput) return;
  const endpoint = getDedicatedUploadUrlWithDomain();
  dedicatedUploadApiUrlInput.value = endpoint;
}

r2DomainSelect?.addEventListener("change", updateDedicatedUploadApiUI);
setTimeout(updateDedicatedUploadApiUI, 200);

copyUploadApiUrlBtn?.addEventListener("click", async () => {
  const endpoint = getDedicatedUploadUrlWithDomain();
  await copyToClipboard(endpoint, copyUploadApiUrlBtn, "📋 コピー完了!");
});

copyCurlCmdBtn?.addEventListener("click", async () => {
  const endpoint = getDedicatedUploadUrlWithDomain();
  const curlCmd = `curl -X POST "${endpoint}" -F "file=@/path/to/image.webp"`;
  await copyToClipboard(curlCmd, copyCurlCmdBtn, "💻 コピー完了!");
});

downloadSendToBatBtn?.addEventListener("click", () => {
  const endpoint = getDedicatedUploadUrlWithDomain();
  if (!endpoint) {
    alert("⚠️ 配信ドメインURLを設定してください。");
    return;
  }

  const batContent = `<# :
@echo off
chcp 65001 >nul
set "BAT_PATH=%~f0"
set "BAT_ARGS="
:loop
if "%~1"=="" goto :endloop
if defined BAT_ARGS (set "BAT_ARGS=%BAT_ARGS%|||%~1") else (set "BAT_ARGS=%~1")
shift
goto :loop
:endloop
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$s=[System.IO.File]::ReadAllText($env:BAT_PATH, [System.Text.Encoding]::UTF8); & ([ScriptBlock]::Create($s))"
exit /b
#>

$endpoint = "${endpoint}"
$batPath = $env:BAT_PATH
$rawArgs = $env:BAT_ARGS

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 1. 引数なし（ダブルクリック時）: SendTo フォルダへ自動登録
if (-not $rawArgs) {
    $sendtoDir = [Environment]::GetFolderPath([Environment+SpecialFolder]::SendTo)
    $dest = Join-Path $sendtoDir "BYORRへアップロード.bat"
    
    try {
        Copy-Item -Path $batPath -Destination $dest -Force
        [System.Windows.Forms.MessageBox]::Show("【BYORR 登録完了】\`n\`n✅ Windows の「送る」メニューに「BYORRへアップロード」を登録しました！\`n\`nエクスプローラーで画像や動画を右クリック ➜「送る」➜「BYORRへアップロード」でご利用いただけます。\`n\`n※解除・削除したい場合: Win+R ➜ shell:sendto から本ファイルを削除してください。", "登録完了 - BYORR", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    } catch {
        [System.Windows.Forms.MessageBox]::Show("⚠️ 登録に失敗しました: " + $_.Exception.Message, "エラー", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    }
    exit
}

# 2. 引数あり: アップロード処理
$files = $rawArgs -split '\\|\\|\\|'
$urls = @()
$errors = @()

foreach ($f in $files) {
    if (Test-Path $f -PathType Leaf) {
        $curlArgs = @('-s', '-X', 'POST', '-F', ('file=@' + $f), $endpoint)
        
        try {
            $raw = & curl.exe @curlArgs
            $json = $raw | ConvertFrom-Json
            if ($json.success -and $json.url) {
                $urls += $json.url
            } else {
                $err = if ($json.error) { $json.error } else { $raw }
                $errors += ([System.IO.Path]::GetFileName($f) + ': ' + $err)
            }
        } catch {
            $errors += ([System.IO.Path]::GetFileName($f) + ': ' + $_.Exception.Message)
        }
    }
}

if ($urls.Count -gt 0) {
    $clip = $urls -join [Environment]::NewLine
    [System.Windows.Forms.Clipboard]::SetText($clip)
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Information
    $notify.Visible = $true
    $msg = if ($urls.Count -eq 1) { "URLをクリップボードにコピーしました！" } else { "$($urls.Count)件のURLをクリップボードにコピーしました！" }
    $notify.ShowBalloonTip(4000, "BYORR アップロード完了", $msg, [System.Windows.Forms.ToolTipIcon]::Info)
    Start-Sleep -Seconds 2
    $notify.Dispose()
}

if ($errors.Count -gt 0) {
    $errMsg = $errors -join [Environment]::NewLine
    [System.Windows.Forms.MessageBox]::Show("一部またはすべてのアップロードに失敗しました:\`n" + $errMsg, "BYORR アップロードエラー", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
}
`;

  const crlfContent = "\uFEFF" + batContent.replace(/\r?\n/g, "\r\n");
  const blob = new Blob([crlfContent], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = "BYORRへアップロード.bat";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  alert("📥 設定済みの「BYORRへアップロード.bat」をダウンロードしました！\n\n【登録手順】\nダウンロードしたバッチファイルをダブルクリックすると、自動でWindowsの「送る」メニューに登録されます。\n\n【使い方】\nエクスプローラーで画像や動画を右クリック ➜「送る」➜「BYORRへアップロード」で投稿完了＆URLが自動コピーされます！\n\n【解除・削除方法】\nWin + R キーを押し「shell:sendto」と入力して開いたフォルダから、本ファイルを削除してください。");
});

