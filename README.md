# BYORR Converter (Bring Your Own R2 Converter)

外部サーバーや Cloudflare Worker を**一切介さず**、お使いのブラウザ端末内だけで画像を高速・高画質に変換（WebP / JXL / MozJPEG / PNG）し、ご自身の **Cloudflare R2 ストレージ（S3互換 API）にダイレクト保存・配信できる**完全フロントエンド単体の Web アプリケーションです。

---

## 🌟 特徴

- **バックエンド構築・デプロイ作業が完全不要**: Worker やサーバーのコードの作成・デプロイ（`wrangler deploy`）は一切不要です。
- **端末内ローカル処理 (WASM)**: 画像の圧縮・変換・Exifメタデータ削除はすべてブラウザ内で行われるためセキュア＆超高速です。
- **100% ローカル保存 (localStorage)**: R2 の接続情報 (Account ID, Access Key ID, Secret Access Key 等) は、お使いのブラウザ内だけに安全に記録されます。
- **直リンク生成 & 一覧管理**: アップロードされた画像の直リンクコピー、一括削除、容量メーター、5ch用URLパレット機能を完備。

---

## 📋 準備手順（Cloudflare R2 側の設定）

### 1. R2 バケットの作成
1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン。
2. 左メニュー「**R2**」➔「**バケットの作成**」をクリックし、任意の名前（例: `my-bucket`）で作成します。

### 2. CORS (Cross-Origin Resource Sharing) の設定
ブラウザからのダイレクト接続を許可するため、作成した R2 バケットの設定を行います：

1. 作成したバケット ➔「**設定 (Settings)**」タブを開きます。
2. 「**CORS ポリシー**」項目で「**CORS ポリシーの編集**」をクリックし、以下の JSON を貼り付けて保存します：

```json
[
  {
    "AllowedOrigins": [
      "*"
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

### 3. S3 API トークンの発行
1. Cloudflare ダッシュボード「**R2**」画面の右側にある「**R2 API トークンの管理**」をクリック。
2. 「**API トークンを作成する**」をクリック。
3. 権限を「**オブジェクトの読み取りと書き込み**」にし、対象のバケットを選択して作成します。
4. 発行された以下を控え、アプリの「☁️ Cloudflare R2 接続設定」に入力してください：
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**

---

## 🛠️ 開発・ビルド

```bash
# 依存関係のインストール
npm install

# ローカル開発サーバーの起動
npm run preview

# 静的ビルド (dist/ へ出力)
npm run build
```
