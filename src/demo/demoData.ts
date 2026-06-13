import type { Group, List, Task } from '../types';

export const demoGroups: Group[] = [
  { id: 'g1', name: '仕事', order: 1, createdAt: new Date() },
  { id: 'g2', name: 'プライベート', order: 2, createdAt: new Date() },
];

export const demoLists: List[] = [
  { id: 'l1', name: '開発タスク', groupId: 'g1', order: 1, createdAt: new Date() },
  { id: 'l2', name: 'ミーティング', groupId: 'g1', order: 2, createdAt: new Date() },
  { id: 'l3', name: '買い物', groupId: 'g2', order: 1, createdAt: new Date() },
];

const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);

export const demoTasks: Task[] = [
  {
    id: 't1', content: 'PWAアプリのデザイン確認', detail: 'モバイルとデスクトップ両方のレイアウトをチェックする',
    priority: 'S', dueDate: null, listId: 'l1', status: 'active',
    order: 1, todayDate: todayStr, isTopPriority: true, isSecondPriority: false,
    completedAt: null, archivedAt: null, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't2', content: 'Firestoreセキュリティルールのテスト', detail: '',
    priority: 'A', dueDate: '2026-06-15', listId: 'l1', status: 'active',
    order: 2, todayDate: todayStr, isTopPriority: false, isSecondPriority: true,
    completedAt: null, archivedAt: null, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't3', content: 'GitHub Pagesへのデプロイ', detail: '',
    priority: 'B', dueDate: null, listId: 'l1', status: 'active',
    order: 3, todayDate: todayStr, isTopPriority: false, isSecondPriority: false,
    completedAt: null, archivedAt: null, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't4', content: '週次レビューの準備', detail: '先週の振り返りと来週の計画を作成',
    priority: 'C', dueDate: null, listId: 'l2', status: 'active',
    order: 1, todayDate: null, isTopPriority: false, isSecondPriority: false,
    completedAt: null, archivedAt: null, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't5', content: 'APIドキュメントの整備', detail: '',
    priority: 'B', dueDate: null, listId: 'l1', status: 'active',
    order: 4, todayDate: null, isTopPriority: false, isSecondPriority: false,
    completedAt: null, archivedAt: null, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't6', content: 'ユニットテストを書く', detail: '',
    priority: 'D', dueDate: null, listId: 'l1', status: 'completed',
    order: 5, todayDate: null, isTopPriority: false, isSecondPriority: false,
    completedAt: now, archivedAt: null, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't7', content: 'ドキュメント更新', detail: '',
    priority: 'B', dueDate: null, listId: 'l1', status: 'archived',
    order: 6, todayDate: null, isTopPriority: false, isSecondPriority: false,
    completedAt: null, archivedAt: yesterday, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't8', content: 'コードレビュー対応', detail: 'レビューコメントを確認して修正する',
    priority: 'A', dueDate: null, listId: 'l2', status: 'completed',
    order: 2, todayDate: null, isTopPriority: false, isSecondPriority: false,
    completedAt: yesterday, archivedAt: null, createdAt: new Date(), copiedFromId: null,
  },
  {
    id: 't9', content: 'スプリント計画の作成', detail: '',
    priority: 'B', dueDate: null, listId: 'l2', status: 'archived',
    order: 3, todayDate: null, isTopPriority: false, isSecondPriority: false,
    completedAt: null, archivedAt: yesterday, createdAt: new Date(), copiedFromId: null,
  },
];
