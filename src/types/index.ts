export type Priority = 'S' | 'A' | 'B' | 'C' | 'D';
export type TaskStatus = 'active' | 'completed' | 'archived';

export interface Group {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
}

export interface List {
  id: string;
  name: string;
  groupId: string;
  order: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  content: string;
  detail: string;
  priority: Priority;
  dueDate: string | null;
  listId: string;
  status: TaskStatus;
  addedToToday: boolean;      // trueのタスクだけが今日ビューに表示される
  isTopPriority: boolean;
  isSecondPriority: boolean;
  completedAt: Date | null;
  archivedAt: Date | null;
  order: number;
  createdAt: Date;
  copiedFromId: string | null;
}
