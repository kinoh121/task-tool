# HANDOFF.md — タスク管理PWA 引き継ぎメモ

## プロジェクト概要

個人用タスク管理PWA。React 19 + TypeScript + Vite + Firebase (Firestore/Auth) + GitHub Pages。
デモモード (`VITE_DEMO_MODE=true`) でFirebaseなしに動作確認可能。

**ディレクトリ**: `C:\Users\kinoh\task-tool`

---

## 現在の実装状態（完了済み）

### データモデル (`src/types/index.ts`)
```typescript
interface Task {
  id, content, detail, priority: 'S'|'A'|'B'|'C'|'D'
  dueDate: string | null, listId, status: 'active'|'completed'|'archived'
  order: number                  // DnD並び替え用
  addedToToday: boolean          // 今日ビュー/リストビューの分離
  isTopPriority, isSecondPriority: boolean
  completedAt, archivedAt, createdAt: Date | null
  copiedFromId: string | null
}
```

### 実装済み機能
| 機能 | ファイル |
|------|---------|
| 今日ビュー（日付・曜日表示、最重要/次点カード） | `src/views/TodayView/index.tsx` |
| リストビュー（DnD並び替え、グループ/リスト選択） | `src/views/ListView/index.tsx` |
| 完了ビュー | `src/views/CompletedView/index.tsx` |
| アーカイブビュー | `src/views/ArchiveView/index.tsx` |
| 過去ビュー（3ヶ月分、日付ナビ） | `src/views/PastView/index.tsx` |
| サイドナビ（グループ/リスト管理、ツリー表示） | `src/components/layout/SideNav.tsx` |
| タスクカード | `src/components/task/TaskCard.tsx` |
| タスクフォーム（編集・コピー機能） | `src/components/task/TaskForm.tsx` |
| 優先度バッジ（クリックでドロップダウン変更） | `src/components/task/PriorityBadge.tsx` |
| デモデータ | `src/demo/demoData.ts` |

### 今日ビューの主要仕様
- ヘッダー: 「今日のタスク」＋「M月D日（曜日）」
- 最重要タスク: オレンジ背景 `rgba(255,110,30,0.10)`、★ボタンで設定/解除（トグル）
- 次点タスク: 黄色背景 `rgba(220,180,0,0.10)`、☆ボタンで設定/解除（トグル）
- 優先カードとその他の間にセパレーター
- 複数追加ボタン（`addedToToday: true`, 優先度A, `state.lists[0]`に追加）
- 下部に「＋」ダッシュボタン

### リストビューの主要仕様
- `addedToToday: false` のタスクのみ表示（今日ビューと分離）
- `order` フィールドでソート、HTML5 DnDで並び替え
- 複数追加ボタン（優先度A、選択中リストに追加）
- 下部に「＋」ダッシュボタン

### ナビゲーション順序
今日 → リスト → 完了 → 過去 → アーカイブ → ログアウト

---

## 重要な技術的決定事項

### HMRステートキャッシュ問題
- 状態の形が変わった場合（例: `selectedGroupId` → `openGroupIds`）、HMRが古い状態を保持してクラッシュ
- 対策: Reducerに `state.openGroupIds ?? []` の防衛的チェックを追加＋ページリロード

### `verbatimModuleSyntax` (tsconfig)
- 型のみのimportは必ず `import type` を使う必要あり

### 優先度変更時の順序保持
- `updateTask` で優先度変更しても `order` を更新しない → 位置が変わらない

### 優先度の自動アサインなし
- `isTopPriority`/`isSecondPriority` はユーザーが明示的にセットするのみ
- 未設定なら優先カードは表示されない

---

## 未実装・今後の作業

### Firebase本番セットアップ（未着手）
1. Firebaseプロジェクト作成（Firestore + Google Auth有効化）
2. `.env.local` にFirebase設定値を記入（`.env.example` を参照）
3. `src/firebase.ts` の設定確認
4. `firestore.rules` の `YOUR_EMAIL@gmail.com` を実際のアドレスに変更
5. `firebase deploy --only firestore:rules`

### GitHub Pagesデプロイ（未着手）
1. `vite.config.ts` の `base` をリポジトリ名に変更
2. `package.json` の `homepage` を設定
3. `npm run deploy`（gh-pagesパッケージ使用）

### 日付切り替えロジック（未実装）
- `useDailyCheck.ts`: 前回アクセス日と今日が異なる場合、activeタスクをすべてarchivedに変更
- `/copy` ルートの `CopySelectionView`: アーカイブされたタスクからコピー選択

### モバイル対応（部分的）
- BottomNav（モバイル用）は未実装
- SideNavのみ（デスクトップ想定）

### PWA設定確認
- `vite-plugin-pwa` は設定済みだが、本番ビルドでのServiceWorker動作は未確認

---

## 開発コマンド

```bash
cd C:\Users\kinoh\task-tool
npm run dev          # デモモードで起動（VITE_DEMO_MODE=true が .env.local に設定済みのはず）
npm run build        # 本番ビルド
npm run deploy       # GitHub Pagesにデプロイ（gh-pagesが必要）
```

デモモードの確認: `.env.local` に `VITE_DEMO_MODE=true` があればFirebase不要で動作。

---

## ファイル構成（主要ファイルのみ）

```
src/
├── App.tsx                          # ルート定義（HashRouter）
├── types/index.ts                   # 全型定義
├── contexts/
│   ├── AppContext.tsx                # UI状態（selectedListId, openGroupIds）
│   └── TaskContext.tsx              # タスクCRUD（Demo/Real両プロバイダ）
├── demo/demoData.ts                 # デモ用初期データ
├── views/
│   ├── TodayView/index.tsx
│   ├── ListView/index.tsx
│   ├── CompletedView/index.tsx
│   ├── ArchiveView/index.tsx
│   └── PastView/index.tsx
├── components/
│   ├── layout/SideNav.tsx
│   ├── task/{TaskCard,TaskForm,PriorityBadge}.tsx
│   └── ui/Modal.tsx
└── utils/{dateUtils,priorityUtils,priorityColors}.ts
```
