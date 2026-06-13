import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp, type Timestamp, writeBatch, setDoc, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import type { Group, List, Task, Priority, TaskStatus, ScheduleItem } from '../types';
import { todayString } from '../utils/dateUtils';
import { demoGroups, demoLists, demoTasks } from '../demo/demoData';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// 旧フォーマット移行は1セッション1回のみ
let migrationDone = false;

interface TaskState {
  groups: Group[];
  lists: List[];
  tasks: Task[];
  scheduleItems: ScheduleItem[];
  loading: boolean;
}

type TaskAction =
  | { type: 'SET_GROUPS'; groups: Group[] }
  | { type: 'SET_LISTS'; lists: List[] }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'SET_SCHEDULE'; items: ScheduleItem[] }
  | { type: 'SET_LOADING'; loading: boolean };

function fromTimestamp(ts: Timestamp | null | undefined): Date | null {
  return ts ? ts.toDate() : null;
}

function taskFromDoc(id: string, data: Record<string, unknown>): Task {
  // 旧フォーマット（addedToToday: boolean）からの移行: todayDate フィールドがなければ変換
  let todayDate: string | null = null;
  if (data.todayDate !== undefined) {
    todayDate = (data.todayDate as string | null) || null;
  } else if (Boolean(data.addedToToday)) {
    todayDate = todayString(); // 既存データの移行: 今日の日付として扱う
  }
  return {
    id,
    content: (data.content as string) || '',
    detail: (data.detail as string) || '',
    priority: (data.priority as Priority) || 'none',
    dueDate: (data.dueDate as string | null) || null,
    listId: (data.listId as string) || '',
    status: (data.status as TaskStatus) || 'active',
    todayDate,
    isTopPriority: Boolean(data.isTopPriority),
    isSecondPriority: Boolean(data.isSecondPriority),
    completedAt: fromTimestamp(data.completedAt as Timestamp | null),
    archivedAt: fromTimestamp(data.archivedAt as Timestamp | null),
    createdAt: fromTimestamp(data.createdAt as Timestamp) || new Date(),
    order: (data.order as number) || 0,
    copiedFromId: (data.copiedFromId as string | null) || null,
    wasInToday: Boolean(data.wasInToday),
  };
}

function reducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_GROUPS': return { ...state, groups: action.groups };
    case 'SET_LISTS': return { ...state, lists: action.lists };
    case 'SET_TASKS': return { ...state, tasks: action.tasks };
    case 'SET_SCHEDULE': return { ...state, scheduleItems: action.items };
    case 'SET_LOADING': return { ...state, loading: action.loading };
    default: return state;
  }
}

interface TaskContextValue {
  state: TaskState;
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
  restoreTask: (id: string) => Promise<void>;
  archiveTasks: (ids: string[]) => Promise<void>;
  copyTasks: (ids: string[]) => Promise<void>;
  addToToday: (id: string) => Promise<void>;
  removeFromToday: (id: string) => Promise<void>;
  setTopPriority: (id: string) => Promise<void>;
  setSecondPriority: (id: string) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  saveDailySnapshot: (date: string, taskIds: string[]) => Promise<void>;
  getDailySnapshot: (date: string) => Promise<string[] | null>;
  addScheduleItem: (item: { label: string; time: string; priority: Priority; taskId: string | null }) => Promise<void>;
  removeScheduleItem: (id: string) => Promise<void>;
  clearSchedule: () => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

let demoIdSeq = 200;
function DemoTaskProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(demoGroups);
  const [lists, setLists] = useState<List[]>(demoLists);
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const newId = () => String(++demoIdSeq);

  const val: TaskContextValue = {
    state: { groups, lists, tasks, scheduleItems: [], loading: false },
    addGroup: async (name) => { const id = newId(); setGroups(g => [...g, { id, name, order: Date.now(), createdAt: new Date() }]); return id; },
    updateGroup: async (id, name) => setGroups(g => g.map(x => x.id === id ? { ...x, name } : x)),
    deleteGroup: async (id) => setGroups(g => g.filter(x => x.id !== id)),
    addList: async (name, groupId) => { const id = newId(); setLists(l => [...l, { id, name, groupId, order: Date.now(), createdAt: new Date() }]); return id; },
    updateList: async (id, name) => setLists(l => l.map(x => x.id === id ? { ...x, name } : x)),
    deleteList: async (id) => setLists(l => l.filter(x => x.id !== id)),
    addTask: async (data) => {
      const id = newId();
      setTasks(prev => {
        const maxOrder = prev.filter(t => t.listId === data.listId).reduce((m, t) => Math.max(m, t.order ?? 0), 0);
        return [...prev, { id, content: data.content || '', detail: data.detail || '', priority: data.priority || 'none', dueDate: data.dueDate ?? null, listId: data.listId || '', status: 'active', order: maxOrder + 1, todayDate: data.todayDate ?? null, isTopPriority: false, isSecondPriority: false, completedAt: null, archivedAt: null, createdAt: new Date(), copiedFromId: null }];
      });
      return id;
    },
    updateTask: async (id, data) => setTasks(t => t.map(x => x.id === id ? { ...x, ...data } : x)),
    deleteTask: async (id) => setTasks(t => t.filter(x => x.id !== id)),
    completeTask: async (id) => setTasks(t => t.map(x => x.id === id ? { ...x, status: 'completed', completedAt: new Date(), todayDate: null, isTopPriority: false, isSecondPriority: false, wasInToday: x.todayDate !== null } : x)),
    restoreTask: async (id) => setTasks(t => t.map(x => x.id === id ? { ...x, status: 'active', completedAt: null } : x)),
    archiveTasks: async (ids) => setTasks(t => t.map(x => ids.includes(x.id) ? { ...x, status: 'archived', archivedAt: new Date(), todayDate: null, isTopPriority: false, isSecondPriority: false, wasInToday: x.todayDate !== null } : x)),
    copyTasks: async (ids) => {
      setTasks(prev => {
        const copies = prev.filter(t => ids.includes(t.id)).map(t => ({ ...t, id: newId(), status: 'active' as TaskStatus, todayDate: todayString(), createdAt: new Date(), archivedAt: null, completedAt: null, copiedFromId: t.id, isTopPriority: false, isSecondPriority: false }));
        return [...copies, ...prev];
      });
    },
    addToToday: async (id) => setTasks(t => t.map(x => x.id === id ? { ...x, todayDate: todayString() } : x)),
    removeFromToday: async (id) => setTasks(t => t.map(x => x.id === id ? { ...x, todayDate: null, isTopPriority: false, isSecondPriority: false } : x)),
    setTopPriority: async (id) => setTasks(prev => {
      const task = prev.find(x => x.id === id);
      if (!task) return prev;
      if (task.isTopPriority) {
        return prev.map(x => x.id === id ? { ...x, isTopPriority: false } : x);
      }
      return prev.map(x => ({ ...x, isTopPriority: x.id === id, isSecondPriority: x.id === id ? false : x.isSecondPriority }));
    }),
    setSecondPriority: async (id) => setTasks(prev => {
      const task = prev.find(x => x.id === id);
      if (!task) return prev;
      if (task.isSecondPriority) {
        return prev.map(x => x.id === id ? { ...x, isSecondPriority: false } : x);
      }
      return prev.map(x => ({ ...x, isSecondPriority: x.id === id, isTopPriority: x.id === id ? false : x.isTopPriority }));
    }),
    reorderTasks: async (orderedIds) => {
      setTasks(prev => {
        const idMap = new Map(prev.map(t => [t.id, t]));
        const updated = new Map(orderedIds.map((id, i) => [id, { ...idMap.get(id)!, order: i + 1 }]));
        return prev.map(t => updated.get(t.id) ?? t);
      });
    },
    saveDailySnapshot: async () => { /* demo: no-op */ },
    getDailySnapshot: async () => null,
    addScheduleItem: async () => {},
    removeScheduleItem: async () => {},
    clearSchedule: async () => {},
    duplicateTask: async (id) => {
      setTasks(prev => {
        const src = prev.find(t => t.id === id);
        if (!src) return prev;
        const maxOrder = prev.filter(t => t.listId === src.listId).reduce((m, t) => Math.max(m, t.order ?? 0), 0);
        const copy: Task = { ...src, id: String(++demoIdSeq), order: maxOrder + 1, createdAt: new Date(), copiedFromId: id, isTopPriority: false, isSecondPriority: false };
        return [...prev, copy];
      });
    },
  };
  return <TaskContext.Provider value={val}>{children}</TaskContext.Provider>;
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  if (DEMO) return <DemoTaskProvider>{children}</DemoTaskProvider>;
  return <RealTaskProvider>{children}</RealTaskProvider>;
}

function RealTaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { groups: [], lists: [], tasks: [], scheduleItems: [], loading: true });

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_LOADING', loading: false });
      return;
    }
    const uid = user.uid;

    const unsubGroups = onSnapshot(
      query(collection(db, 'users', uid, 'groups'), orderBy('order')),
      (snap) => {
        const groups: Group[] = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          order: d.data().order,
          createdAt: (d.data().createdAt as Timestamp)?.toDate() || new Date(),
        }));
        dispatch({ type: 'SET_GROUPS', groups });
      }
    );

    const unsubLists = onSnapshot(
      query(collection(db, 'users', uid, 'lists'), orderBy('order')),
      (snap) => {
        const lists: List[] = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          groupId: d.data().groupId,
          order: d.data().order,
          createdAt: (d.data().createdAt as Timestamp)?.toDate() || new Date(),
        }));
        dispatch({ type: 'SET_LISTS', lists });
      }
    );

    const unsubTasks = onSnapshot(
      query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt', 'desc')),
      (snap) => {
        const tasks: Task[] = snap.docs.map((d) =>
          taskFromDoc(d.id, d.data() as Record<string, unknown>)
        );
        dispatch({ type: 'SET_TASKS', tasks });
        dispatch({ type: 'SET_LOADING', loading: false });

        // 旧フォーマット（addedToToday あり、todayDate フィールドなし）を一度だけ移行
        if (!migrationDone) {
          migrationDone = true;
          const oldDocs = snap.docs.filter((d) => d.data().todayDate === undefined);
          if (oldDocs.length > 0) {
            const batch = writeBatch(db);
            for (const d of oldDocs) {
              const newTodayDate = Boolean(d.data().addedToToday) ? todayString() : null;
              batch.update(doc(db, 'users', uid, 'tasks', d.id), { todayDate: newTodayDate });
            }
            batch.commit().catch(() => { migrationDone = false; }); // 失敗時は次回リトライ
          }
        }
      }
    );

    const unsubSchedule = onSnapshot(
      query(collection(db, 'users', uid, 'scheduleItems'), orderBy('time')),
      (snap) => {
        const items: ScheduleItem[] = snap.docs.map((d) => ({
          id: d.id,
          label: d.data().label as string,
          time: d.data().time as string,
          priority: (d.data().priority as Priority) || 'none',
          taskId: (d.data().taskId as string | null) || null,
          createdAt: fromTimestamp(d.data().createdAt as Timestamp) || new Date(),
        }));
        dispatch({ type: 'SET_SCHEDULE', items });
      }
    );

    return () => { unsubGroups(); unsubLists(); unsubTasks(); unsubSchedule(); };
  }, [user]);

  const uid = user?.uid || '';

  const addGroup = async (name: string) => {
    const ref = await addDoc(collection(db, 'users', uid, 'groups'), {
      name, order: Date.now(), createdAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateGroup = async (id: string, name: string) => {
    await updateDoc(doc(db, 'users', uid, 'groups', id), { name });
  };

  const deleteGroup = async (id: string) => {
    await deleteDoc(doc(db, 'users', uid, 'groups', id));
  };

  const addList = async (name: string, groupId: string) => {
    const ref = await addDoc(collection(db, 'users', uid, 'lists'), {
      name, groupId, order: Date.now(), createdAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateList = async (id: string, name: string) => {
    await updateDoc(doc(db, 'users', uid, 'lists', id), { name });
  };

  const deleteList = async (id: string) => {
    await deleteDoc(doc(db, 'users', uid, 'lists', id));
  };

  const addTask = async (data: Partial<Task>) => {
    const ref = await addDoc(collection(db, 'users', uid, 'tasks'), {
      content: data.content || '',
      detail: data.detail || '',
      priority: data.priority || 'none',
      dueDate: data.dueDate || null,
      listId: data.listId || '',
      status: 'active',
      todayDate: data.todayDate ?? null,
      isTopPriority: false,
      isSecondPriority: false,
      completedAt: null,
      archivedAt: null,
      createdAt: serverTimestamp(),
      copiedFromId: data.copiedFromId || null,
    });
    return ref.id;
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    if (data.content !== undefined) update.content = data.content;
    if (data.detail !== undefined) update.detail = data.detail;
    if (data.priority !== undefined) update.priority = data.priority;
    if (data.dueDate !== undefined) update.dueDate = data.dueDate;
    if (data.listId !== undefined) update.listId = data.listId;
    if (data.status !== undefined) update.status = data.status;
    if (data.todayDate !== undefined) update.todayDate = data.todayDate;
    if (data.isTopPriority !== undefined) update.isTopPriority = data.isTopPriority;
    if (data.isSecondPriority !== undefined) update.isSecondPriority = data.isSecondPriority;
    await updateDoc(doc(db, 'users', uid, 'tasks', id), update);
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'users', uid, 'tasks', id));
  };

  const completeTask = async (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    await updateDoc(doc(db, 'users', uid, 'tasks', id), {
      status: 'completed',
      completedAt: serverTimestamp(),
      todayDate: null,
      isTopPriority: false,
      isSecondPriority: false,
      wasInToday: task?.todayDate !== null && task?.todayDate !== undefined,
    });
  };

  const restoreTask = async (id: string) => {
    await updateDoc(doc(db, 'users', uid, 'tasks', id), {
      status: 'active',
      completedAt: null,
    });
  };

  const archiveTasks = async (ids: string[]) => {
    const batch = writeBatch(db);
    for (const id of ids) {
      const task = state.tasks.find((t) => t.id === id);
      batch.update(doc(db, 'users', uid, 'tasks', id), {
        status: 'archived',
        archivedAt: serverTimestamp(),
        todayDate: null,
        isTopPriority: false,
        isSecondPriority: false,
        wasInToday: task?.todayDate !== null && task?.todayDate !== undefined,
      });
    }
    await batch.commit();
  };

  const copyTasks = async (ids: string[]) => {
    const tasksToCopy = state.tasks.filter((t) => ids.includes(t.id));
    const batch = writeBatch(db);
    for (const task of tasksToCopy) {
      const newRef = doc(collection(db, 'users', uid, 'tasks'));
      batch.set(newRef, {
        content: task.content,
        detail: task.detail,
        priority: task.priority,
        dueDate: task.dueDate,
        listId: task.listId,
        status: 'active',
        todayDate: todayString(),
        isTopPriority: false,
        isSecondPriority: false,
        completedAt: null,
        archivedAt: null,
        createdAt: serverTimestamp(),
        copiedFromId: task.id,
      });
    }
    await batch.commit();
  };

  const addToToday = async (id: string) => {
    await updateDoc(doc(db, 'users', uid, 'tasks', id), { todayDate: todayString() });
  };

  const removeFromToday = async (id: string) => {
    await updateDoc(doc(db, 'users', uid, 'tasks', id), {
      todayDate: null, isTopPriority: false, isSecondPriority: false,
    });
  };

  const setTopPriority = async (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    const batch = writeBatch(db);
    if (task.isTopPriority) {
      batch.update(doc(db, 'users', uid, 'tasks', id), { isTopPriority: false });
    } else {
      for (const t of state.tasks.filter((t) => t.isTopPriority)) {
        batch.update(doc(db, 'users', uid, 'tasks', t.id), { isTopPriority: false });
      }
      batch.update(doc(db, 'users', uid, 'tasks', id), { isTopPriority: true, isSecondPriority: false });
    }
    await batch.commit();
  };

  const setSecondPriority = async (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    const batch = writeBatch(db);
    if (task.isSecondPriority) {
      batch.update(doc(db, 'users', uid, 'tasks', id), { isSecondPriority: false });
    } else {
      for (const t of state.tasks.filter((t) => t.isSecondPriority)) {
        batch.update(doc(db, 'users', uid, 'tasks', t.id), { isSecondPriority: false });
      }
      batch.update(doc(db, 'users', uid, 'tasks', id), { isSecondPriority: true, isTopPriority: false });
    }
    await batch.commit();
  };

  const reorderTasks = async (orderedIds: string[]) => {
    const batch = writeBatch(db);
    orderedIds.forEach((id, i) => {
      batch.update(doc(db, 'users', uid, 'tasks', id), { order: i + 1 });
    });
    await batch.commit();
  };

  const addScheduleItem = async (item: { label: string; time: string; priority: Priority; taskId: string | null }) => {
    await addDoc(collection(db, 'users', uid, 'scheduleItems'), {
      ...item, createdAt: serverTimestamp(),
    });
  };

  const removeScheduleItem = async (id: string) => {
    await deleteDoc(doc(db, 'users', uid, 'scheduleItems', id));
  };

  const clearSchedule = async () => {
    const batch = writeBatch(db);
    for (const item of state.scheduleItems) {
      batch.delete(doc(db, 'users', uid, 'scheduleItems', item.id));
    }
    await batch.commit();
  };

  // 日次スナップショットを保存
  const saveDailySnapshot = async (date: string, taskIds: string[]) => {
    await setDoc(doc(db, 'users', uid, 'dailySnapshots', date), {
      taskIds,
      createdAt: serverTimestamp(),
    });
  };

  // 日次スナップショットを取得（null = 未記録）
  const getDailySnapshot = async (date: string): Promise<string[] | null> => {
    const snap = await getDoc(doc(db, 'users', uid, 'dailySnapshots', date));
    if (!snap.exists()) return null;
    return (snap.data().taskIds as string[]) || [];
  };

  const duplicateTask = async (id: string) => {
    const src = state.tasks.find((t) => t.id === id);
    if (!src) return;
    const maxOrder = state.tasks.filter((t) => t.listId === src.listId).reduce((m, t) => Math.max(m, t.order ?? 0), 0);
    await addDoc(collection(db, 'users', uid, 'tasks'), {
      content: src.content, detail: src.detail, priority: src.priority,
      dueDate: src.dueDate, listId: src.listId, status: 'active',
      order: maxOrder + 1, todayDate: src.todayDate,
      isTopPriority: false, isSecondPriority: false,
      completedAt: null, archivedAt: null,
      createdAt: serverTimestamp(), copiedFromId: id,
    });
  };

  return (
    <TaskContext.Provider value={{
      state, addGroup, updateGroup, deleteGroup,
      addList, updateList, deleteList,
      addTask, updateTask, deleteTask, completeTask, restoreTask,
      archiveTasks, copyTasks, addToToday, removeFromToday,
      setTopPriority, setSecondPriority, reorderTasks, duplicateTask,
      saveDailySnapshot, getDailySnapshot,
      addScheduleItem, removeScheduleItem, clearSchedule,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
}

// Convenience: query archived tasks from yesterday's archiving session
export function useArchivedYesterday() {
  const { state } = useTaskContext();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return state.tasks.filter(
    (t) => t.status === 'archived' && t.archivedAt && t.archivedAt >= yesterday
  );
}
