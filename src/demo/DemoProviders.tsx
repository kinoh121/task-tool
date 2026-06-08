import React, { createContext, useContext, useState } from 'react';
import type { Group, List, Task } from '../types';
import { demoGroups, demoLists, demoTasks } from './demoData';

// ---- Auth ----
interface AuthVal { user: { uid: string; email: string; displayName: string } | null; loading: boolean; signIn: () => Promise<void>; handleSignOut: () => Promise<void>; }
const AuthCtx = createContext<AuthVal | null>(null);
export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthVal['user']>({ uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' });
  return (
    <AuthCtx.Provider value={{ user, loading: false, signIn: async () => setUser({ uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' }), handleSignOut: async () => setUser(null) }}>
      {children}
    </AuthCtx.Provider>
  );
}
export function useDemoAuth() { return useContext(AuthCtx)!; }

// ---- App State ----
interface AppVal { state: { selectedListId: string | null; selectedGroupId: string | null; showCopyScreen: boolean }; dispatch: React.Dispatch<{ type: string; listId?: string | null; groupId?: string | null }>; }
const AppCtx = createContext<AppVal | null>(null);
export function DemoAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ selectedListId: null as string | null, selectedGroupId: null as string | null, showCopyScreen: false });
  const dispatch = (action: { type: string; listId?: string | null; groupId?: string | null }) => {
    if (action.type === 'SELECT_LIST') setState(s => ({ ...s, selectedListId: action.listId ?? null }));
    if (action.type === 'SELECT_GROUP') setState(s => ({ ...s, selectedGroupId: action.groupId ?? null }));
    if (action.type === 'SHOW_COPY_SCREEN') setState(s => ({ ...s, showCopyScreen: true }));
    if (action.type === 'HIDE_COPY_SCREEN') setState(s => ({ ...s, showCopyScreen: false }));
  };
  return <AppCtx.Provider value={{ state, dispatch: dispatch as AppVal['dispatch'] }}>{children}</AppCtx.Provider>;
}
export function useDemoAppState() { return useContext(AppCtx)!; }

// ---- Tasks ----
interface TaskVal {
  state: { groups: Group[]; lists: List[]; tasks: Task[]; loading: boolean };
  addGroup: (name: string) => Promise<string>;
  updateGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addList: (name: string, groupId: string) => Promise<string>;
  updateList: (id: string, name: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  addTask: (data: Partial<Task>) => Promise<string>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  archiveTasks: (ids: string[]) => Promise<void>;
  copyTasks: (ids: string[]) => Promise<void>;
  setTopPriority: (id: string) => Promise<void>;
  setSecondPriority: (id: string) => Promise<void>;
}
const TaskCtx = createContext<TaskVal | null>(null);

let idSeq = 100;
const uid = () => String(++idSeq);

export function DemoTaskProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(demoGroups);
  const [lists, setLists] = useState<List[]>(demoLists);
  const [tasks, setTasks] = useState<Task[]>(demoTasks);

  const val: TaskVal = {
    state: { groups, lists, tasks, loading: false },
    addGroup: async (name) => { const id = uid(); setGroups(g => [...g, { id, name, order: Date.now(), createdAt: new Date() }]); return id; },
    updateGroup: async (id, name) => setGroups(g => g.map(x => x.id === id ? { ...x, name } : x)),
    deleteGroup: async (id) => setGroups(g => g.filter(x => x.id !== id)),
    addList: async (name, groupId) => { const id = uid(); setLists(l => [...l, { id, name, groupId, order: Date.now(), createdAt: new Date() }]); return id; },
    updateList: async (id, name) => setLists(l => l.map(x => x.id === id ? { ...x, name } : x)),
    deleteList: async (id) => setLists(l => l.filter(x => x.id !== id)),
    addTask: async (data) => {
      const id = uid();
      setTasks(t => [{ id, content: data.content || '', detail: data.detail || '', priority: data.priority || 'C', dueDate: data.dueDate ?? null, listId: data.listId || '', status: 'active', isTopPriority: false, isSecondPriority: false, completedAt: null, archivedAt: null, createdAt: new Date(), copiedFromId: null }, ...t]);
      return id;
    },
    updateTask: async (id, data) => setTasks(t => t.map(x => x.id === id ? { ...x, ...data } : x)),
    deleteTask: async (id) => setTasks(t => t.filter(x => x.id !== id)),
    completeTask: async (id) => setTasks(t => t.map(x => x.id === id ? { ...x, status: 'completed', completedAt: new Date(), isTopPriority: false, isSecondPriority: false } : x)),
    archiveTasks: async (ids) => setTasks(t => t.map(x => ids.includes(x.id) ? { ...x, status: 'archived', archivedAt: new Date(), isTopPriority: false, isSecondPriority: false } : x)),
    copyTasks: async (ids) => {
      const copies = tasks.filter(t => ids.includes(t.id)).map(t => ({ ...t, id: uid(), status: 'active' as const, createdAt: new Date(), archivedAt: null, completedAt: null, copiedFromId: t.id, isTopPriority: false, isSecondPriority: false }));
      setTasks(t => [...copies, ...t]);
    },
    setTopPriority: async (id) => setTasks(t => t.map(x => ({ ...x, isTopPriority: x.id === id, isSecondPriority: x.id === id ? false : x.isSecondPriority }))),
    setSecondPriority: async (id) => setTasks(t => t.map(x => ({ ...x, isSecondPriority: x.id === id, isTopPriority: x.id === id ? false : x.isTopPriority }))),
  };

  return <TaskCtx.Provider value={val}>{children}</TaskCtx.Provider>;
}
export function useDemoTaskContext() { return useContext(TaskCtx)!; }
export function useDemoArchivedYesterday() {
  const { state } = useDemoTaskContext();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0);
  return state.tasks.filter(t => t.status === 'archived' && t.archivedAt && t.archivedAt >= yesterday);
}
