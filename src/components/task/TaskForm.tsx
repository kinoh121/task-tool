import { useState } from 'react';
import type { Task, Priority, List } from '../../types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/priorityUtils';
import { todayString } from '../../utils/dateUtils';
import { useTaskContext } from '../../contexts/TaskContext';

interface Props {
  lists: List[];
  defaultListId?: string;
  defaultAddToToday?: boolean;
  task?: Task;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C', 'D', 'none'];
const TODAY_ID = '__today__';

export function TaskForm({ lists, defaultListId, defaultAddToToday, task, onClose }: Props) {
  const { addTask, updateTask, duplicateTask } = useTaskContext();
  const [content, setContent] = useState(task?.content || '');
  const [detail, setDetail] = useState(task?.detail || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'none');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [listId, setListId] = useState<string>(() => {
    if (task?.todayDate === todayString() || defaultAddToToday) return TODAY_ID;
    return task?.listId || defaultListId || (lists[0]?.id ?? '');
  });
  const [saving, setSaving] = useState(false);

  const resolveListId = () => {
    if (listId === TODAY_ID) return task?.listId || (lists[0]?.id ?? '');
    return listId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    const newTodayDate = listId === TODAY_ID ? todayString() : null;
    const resolvedListId = resolveListId();
    try {
      if (task) {
        await updateTask(task.id, { content, detail, priority, dueDate: dueDate || null, listId: resolvedListId, todayDate: newTodayDate });
      } else {
        await addTask({ content, detail, priority, dueDate: dueDate || null, listId: resolvedListId, todayDate: newTodayDate });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          タスク内容 *
        </label>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="タスクを入力..."
          autoFocus
          required
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          詳細
        </label>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="詳細メモ（任意）"
          rows={3}
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          優先度
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRIORITIES.map((p) => {
            const lbl = PRIORITY_LABELS[p] || '−';
            const color = PRIORITY_COLORS[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 4,
                  border: priority === p ? `2px solid ${color}` : '2px solid var(--border)',
                  background: priority === p ? color + '22' : 'var(--bg-tertiary)',
                  color: priority === p ? color : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: 13,
                  minHeight: 36,
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          期日（任意）
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
          リスト
        </label>
        <select value={listId} onChange={(e) => setListId(e.target.value)}>
          <option value={TODAY_ID}>今日</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        {task && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => { await duplicateTask(task.id); onClose(); }}
            title="このタスクを複製する"
          >
            コピー
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          キャンセル
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? '保存中...' : (task ? '更新' : '追加')}
        </button>
      </div>
    </form>
  );
}
