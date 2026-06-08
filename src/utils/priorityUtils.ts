import type { Task, Priority } from '../types';

const PRIORITY_ORDER: Priority[] = ['S', 'A', 'B', 'C', 'D'];

export function priorityRank(p: Priority): number {
  return PRIORITY_ORDER.indexOf(p);
}

export function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export function getTopPriorityTask(tasks: Task[]): Task | null {
  return tasks.find((t) => t.isTopPriority) ?? null;
}

export function getSecondPriorityTask(tasks: Task[], topId: string | null): Task | null {
  const manual = tasks.find((t) => t.isSecondPriority && t.id !== topId);
  return manual ?? null;
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  S: 'S', A: 'A', B: 'B', C: 'C', D: 'D',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  S: '#ff4757',
  A: '#ff6b35',
  B: '#ffd32a',
  C: '#7bed9f',
  D: '#a4b0be',
};
