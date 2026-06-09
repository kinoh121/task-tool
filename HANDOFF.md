# HANDOFF.md — TaskTool プロジェクト引き継ぎ

最終更新: 2026-06-09

---

## プロジェクト概要

個人用タスク管理PWA。

- **URL**: https://kinoh121.github.io/task-tool/
- **リポジトリ**: https://github.com/kinoh121/task-tool
- **開発ディレクトリ**: `C:\Root\task-tool`
- **Firebase プロジェクト**: `tasktool-f000f`
- **アクセス制限**: `kino.h121@gmail.com` のみ（Firestore rules + Auth）

## 技術スタック

- React 19 + TypeScript + Vite 8（rolldownバンドラー）
- Firebase: Firestore + Google Authentication
- GitHub Pages（`gh-pages`パッケージでデプロイ）
- PWA: **無効化**（Vite 8 rolldown の非ASCII path バグのため `vite-plugin-pwa` を外した）

---

## 重要な決定事項

### なぜ C:\Root\task-tool か
- 元々 `G:/マイドライブ/...`（Google Drive同期フォルダ）にあった
- Vite 8 の rolldown が非ASCII文字パス（`マイドライブ`）でビルドエラーを起こす
- → `C:\Root\task-tool` に移動して解決
- `G:\マイドライブ\work\Obsidian\ClaudeCode\TaskTool\task-tool` は削除済み

### Obsidian連携方式
- ~~Obsidian Local REST API~~ → HTTPSからlocalhostへのMixed Contentで不可
- **採用**: ブラウザのダウンロード先をObsidianのVaultフォルダに設定した専用ブラウザ（Firefox等）でtask toolを使う
- task toolはEdgeでは使わず、専用ブラウザに限定する

---

## 現在の実装状態（完了済み）

### Firebase本番セットアップ ✅
- Google認証
- Firestoreデータ永続化
- セキュリティルール（`kino.h121@gmail.com`のみ）
- 本番URLをAuthorized domainsに追加済み

### GitHub Pages デプロイ ✅
- `npm run deploy` でデプロイ
- `vite.config.ts`: base = `/task-tool/`（本番のみ）
- `package.json`: homepage = `https://kinoh121.github.io/task-tool`

### UI/機能改善 ✅（7項目）
1. **グループ名変更** — SideNavの✎ボタンでインライン編集
2. **リスト名変更** — SideNavの✎ボタンでインライン編集
3. **モバイルでリスト選択画面** — 未選択時にグループ/リストツリーを表示
4. **今日ビューの左寄せ** — `margin: '0 auto'` 削除
5. **「今日」リスト選択肢** — TaskFormのリストセレクターに `TODAY_ID = '__today__'` を追加
6. **今日タスクのDnD** — restTasksのドラッグ&ドロップ並び替え
7. **削除ボタン + 確認ダイアログ** — 全タスクに✕ボタン、`confirm()`で確認

### Obsidian出力機能 ✅
- **今日ビュー**: 「出力」ボタン → `YYYY-MM-DD.md`
  - 最重要→次点→その他の順
  - ヘッダー: `# 今日のタスク YYYY-MM-DD`
  - チェックボックス形式: `- [ ] タスク内容`（優先度なし）
- **リストビュー**: 「出力」ボタン → `{リスト名}_YYYY-MM-DD.md`
  - ヘッダー: `# {リスト名} YYYY-MM-DD`
  - 同形式

---

## ファイル構成（主要ファイル）

```
C:\Root\task-tool\
├── src/
│   ├── components/
│   │   ├── layout/SideNav.tsx        # グループ/リスト管理、名前編集
│   │   └── task/
│   │       ├── TaskCard.tsx          # タスクカード、削除確認
│   │       └── TaskForm.tsx          # フォーム（「今日」選択肢付き）
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Google認証
│   │   └── TaskContext.tsx           # Firestoreデータ管理
│   ├── views/
│   │   ├── TodayView/index.tsx       # 今日ビュー（DnD、Obsidian出力）
│   │   └── ListView/index.tsx        # リストビュー（モバイル対応、Obsidian出力）
│   └── demo/DemoProviders.tsx        # デモモード
├── firestore.rules                   # アクセス制限ルール
├── vite.config.ts                    # base設定、PWA無効
├── .env.local                        # Firebase設定（gitignore済み）
└── package.json
```

### .env.local の内容
```
VITE_DEMO_MODE=false
VITE_FIREBASE_API_KEY=AIzaSyCOHgDkw4y36EJw41yUDe7kj5W6WwEcRd0
VITE_FIREBASE_AUTH_DOMAIN=tasktool-f000f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tasktool-f000f
VITE_FIREBASE_STORAGE_BUCKET=tasktool-f000f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1034396656526
VITE_FIREBASE_APP_ID=1:1034396656526:web:36acf24a707027d3ef7adf
```

---

## デプロイ手順

```powershell
cd C:\Root\task-tool
npm run deploy
```

ビルド → `gh-pages` ブランチへ自動プッシュ → GitHub Pagesに反映（1〜2分）

---

## 既知の問題・制限

- **PWA無効**: Vite 8 rolldownバグのため。将来Viteが修正されれば再有効化可能
- **DnD**: HTML5 Drag and Drop API使用。モバイルタッチ非対応
- **Obsidian出力**: ファイルはダウンロードフォルダへ保存。専用ブラウザのデフォルトダウンロード先をObsidian Vaultに設定して使う

---

## 次にやること（候補）

特に決定事項なし。ユーザーからの要望待ち。考えられる改善案:
- モバイルタッチDnD対応
- タスク完了後のアーカイブ自動化
- PWA再有効化（Vite修正後）
- リスト横断でのタスク検索
