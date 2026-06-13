# HANDOFF.md — TaskTool プロジェクト引き継ぎ

最終更新: 2026-06-10

---

## プロジェクト概要

個人用タスク管理SPA（シングルユーザー）。

- **URL**: https://kinoh121.github.io/task-tool/
- **リポジトリ**: https://github.com/kinoh121/task-tool
- **開発ディレクトリ**: `C:\Root\task-tool`
- **Firebase プロジェクト**: `tasktool-f000f`
- **アクセス制限**: `kino.h121@gmail.com` のみ（Firestore rules + Google Auth）

## 技術スタック

- React 19 + TypeScript + Vite 8（rolldownバンドラー）
- Firebase: Firestore + Google Authentication
- GitHub Pages（`npm run deploy` → `gh-pages -d dist`）
- PWA: **無効化**（Vite 8 rolldown の非ASCII path バグのため）

---

## 重要な決定事項

### パスの問題
- 元々 `G:/マイドライブ/...`（Google Drive同期フォルダ）にあった
- Vite 8 の rolldown が非ASCII文字パス（`マイドライブ`）でビルドエラー
- → `C:\Root\task-tool` に移動して解決（元パスは削除済み）

### 引き継ぎ機能のアーキテクチャ（重要）
- **旧設計の失敗**: `archiveTasks(全activeタスク)` で全タスクをアーカイブ → タスク消失バグを繰り返した
- **現在の設計（スナップショット方式）**:
  - 引き継ぎ時はタスクを**アーカイブしない**。`addedToToday: false` にするだけ
  - `users/{uid}/dailySnapshots/{YYYY-MM-DD}` に当日の今日タスクIDを記録
  - `users/{uid}.lastCopyDate` で1日1回制限を管理
  - 過去ビューはスナップショットを参照する

### アーカイブ機能
- アーカイブ（archive）ページは**削除済み**（完了と機能重複のため）
- `archiveTasks()` 関数はTaskContextに残っているが、**引き継ぎフローからは使わない**
- アーカイブされたタスクが存在する場合は今日ビューに「⚠ 復元」ボタンが表示される

### GAS / 通知
- GASによるAM8時 Gmail通知は設定済み（task-toolのURL付き）
- アプリ側のチェックはAM6時以降に起動した場合に自動実行
- Google Calendar繰り返しイベントでの通知も利用可能

---

## Firestoreデータ構造

```
users/{uid}/
  ├── tasks/{id}              # タスク本体
  │     content, detail, priority, dueDate, listId
  │     status: 'active' | 'completed' | 'archived'
  │     addedToToday: bool    # 今日ビューに表示中か
  │     wasInToday: bool      # 完了/アーカイブ時に今日にいたか（新フィールド）
  │     isTopPriority: bool
  │     isSecondPriority: bool
  │     order, copiedFromId, createdAt, completedAt, archivedAt
  │
  ├── groups/{id}             # グループ（リストの親）
  ├── lists/{id}              # リスト
  │
  ├── scheduleItems/{id}      # スケジュール（日付概念なし）
  │     label, time (HH:MM), priority, taskId, createdAt
  │
  └── dailySnapshots/{YYYY-MM-DD}   # 日次スナップショット
        taskIds: string[]            # その日の今日タスクID一覧
        createdAt: Timestamp

users/{uid}
  lastCopyDate: YYYY-MM-DD    # 引き継ぎ実行済み日付
  email: string
```

---

## 実装済み機能

### 今日ビュー
- 最重要・次点タスクを大きいカードで上部表示
- その他タスクはコンパクトカード、DnDで並び替え（PC: HTML5 DnD、スマホ: 長押し500ms）
- 「引き継ぎ」ボタン: 手動引き継ぎ（1日1回制限）
- 「⚠ 復元」ボタン: アーカイブされたタスクが存在する場合のみ表示
- Obsidianへのmd出力ボタン
- タスクカードの🕐ボタン → スケジュールに追加（10分刻み）

### リストビュー
- グループ → リスト → タスクのツリー構造
- DnDで並び替え（PC/スマホ対応）
- Obsidianへのmd出力ボタン

### スケジュールビュー（新機能）
- 0〜24時の縦型タイムライン（1時間=45px、全体約1080px）
- タスクから時刻を指定して追加（10分刻み）
- 優先度別カラーの左ボーダー
- 個別削除 / 全クリアボタン

### 完了ビュー
- 完了済みタスク一覧（左揃えレイアウト）

### 過去ビュー
- dailySnapshotsを参照してその日の今日タスクを表示
- 前後ナビゲーション（最大90日前）
- 各タスクに「今日へ」ボタン（間違えた時の救済）
- デフォルトで昨日を表示

### 引き継ぎフロー
- AM6以降 + 日付変化 + 今日タスクあり → 自動でコピー選択画面を表示
- 手動引き継ぎボタン（1日1回制限）
- コピー選択画面: チェックボックスで選んで今日に追加
- スキップしても今日のタスクに影響なし

### ナビゲーション
- **PC**: 左サイドバー（SideNav）
  - 今日 → リスト（ツリー） → スケジュール → 完了 → 過去
  - グループ名・リスト名: ダブルクリックで編集 / ✎アイコン削除済み
- **スマホ**: 下部タブバー（BottomNav）
  - 今日 → リスト → スケジュール → 完了 → 過去

### タスク操作
- 優先度変更（PriorityBadgeクリック）
- タイトルインライン編集（ダブルクリック）
- 詳細編集（TaskFormモーダル）
- 今日への追加 / 最重要・次点設定
- スケジュール追加（🕐ボタン）
- 複製（TaskForm内コピーボタン → addedToToday引き継ぎ）
- 削除（確認ダイアログあり）

### モーダル
- スマホではキーボード表示を考慮して上部寄せ表示

---

## ファイル構成（主要ファイル）

```
C:\Root\task-tool\
├── src/
│   ├── App.tsx                              # ルーティング定義
│   ├── types/index.ts                       # Task, ScheduleItem など型定義
│   ├── contexts/
│   │   ├── AppContext.tsx                   # UI状態（コピー画面表示など）
│   │   ├── AuthContext.tsx                  # Google認証
│   │   └── TaskContext.tsx                  # Firestoreデータ管理（主要）
│   ├── hooks/
│   │   ├── useDailyCheck.ts                 # 日次引き継ぎロジック
│   │   ├── useTouchSortable.ts              # スマホ長押しDnD
│   │   └── useAutoDelete.ts                 # 90日以上前のタスク自動削除
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SideNav.tsx                  # PC左ナビ（グループ/リスト管理）
│   │   │   ├── BottomNav.tsx                # スマホ下部タブ
│   │   │   └── AppShell.tsx                 # レイアウト外枠
│   │   ├── task/
│   │   │   ├── TaskCard.tsx                 # タスクカード（🕐スケジュール追加付き）
│   │   │   ├── TaskForm.tsx                 # タスク編集モーダル
│   │   │   └── PriorityBadge.tsx            # 優先度バッジ
│   │   └── ui/Modal.tsx                     # モーダル（スマホ上部寄せ対応）
│   ├── views/
│   │   ├── TodayView/index.tsx              # 今日ビュー（PriorityCard含む）
│   │   ├── ListView/index.tsx               # リストビュー
│   │   ├── ScheduleView/index.tsx           # スケジュールビュー（新）
│   │   ├── CompletedView/index.tsx          # 完了ビュー
│   │   ├── PastView/index.tsx               # 過去ビュー（スナップショット参照）
│   │   └── CopySelectionView/index.tsx      # 引き継ぎ選択画面
│   ├── utils/
│   │   └── dateUtils.ts                     # todayString, yesterdayString, toDateString
│   └── styles/globals.css                   # CSS変数（カラーテーマ）
├── firestore.rules                          # アクセス制限ルール
├── vite.config.ts                           # base=/task-tool/、PWA無効
├── .env.local                               # Firebase設定（gitignore済み）
└── package.json
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
- **スケジュール**: 日付概念なし（毎日同じスケジュールを使い回す想定）
- **スナップショット**: 引き継ぎを一度も実行していない日付は過去ビューに記録なし
- **wasInToday フィールド**: 引き継ぎ機能導入前のタスクには設定されていない（後付けフィールド）
- **通知**: ブラウザPush通知は未実装。GAS（Gmail）またはGoogleカレンダー通知で代替

---

## 次にやること（候補）

現在決定済みのタスクはなし。考えられる改善案:

- スケジュールに持続時間（分単位）を設定できるようにする
- 過去ビューの「今日へ」ボタンをまとめて選択できるようにする
- PWA再有効化（Vite修正後）
- タスク検索機能
- FCM + Cloud Functions による本格的なPush通知（PWA有効化後）
