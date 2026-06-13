export type Priority = 'S' | 'A' | 'B' | 'C' | 'D' | 'none';

export interface ScheduleItem {
  id: string;
  label: string;
  time: string;       // "HH:MM" (10分刻み)
  priority: Priority;
  taskId: string | null;
  createdAt: Date;
}
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
  todayDate: string | null;    // "YYYY-MM-DD" の日付と一致するタスクが今日ビューに表示される
  isTopPriority: boolean;
  isSecondPriority: boolean;
  completedAt: Date | null;
  archivedAt: Date | null;
  wasInToday?: boolean;
  order: number;
  createdAt: Date;
  copiedFromId: string | null;
}
