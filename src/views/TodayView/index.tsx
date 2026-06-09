import { useState, useRef, useEffect } from 'react';
import type { Priority, Task } from '../../types';
import { useTaskContext } from '../../contexts/TaskContext';
import { TaskCard } from '../../components/task/TaskCard';
import { TaskForm } from '../../components/task/TaskForm';
import { Modal } from '../../components/ui/Modal';
import { PriorityBadge } from '../../components/task/PriorityBadge';
import { getTopPriorityTask, getSecondPriorityTask } from '../../utils/priorityUtils';
import { useTouchSortable } from '../../hooks/useTouchSortable';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatTodayHeader(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const w = WEEKDAYS[now.getDay()];
  return `${m}月${d}日（${w}）`;
}

function downloadMd(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function reorderArray(arr: Task[], fromId: string, toId: string): Task[] {
  const result = [...arr];
  const fromIdx = result.findIndex((t) => t.id === fromId);
  const toIdx = result.findIndex((t) => t.id === toId);
  if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return result;
  const [moved] = result.splice(fromIdx, 1);
  result.splice(toIdx, 0, moved);
  return result;
}

export function TodayView() {
  const { state, deleteTask, completeTask, setTopPriority, setSecondPriority, updateTask, addTask, reorderTasks } = useTaskContext();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const todayTasks = state.tasks.filter((t) => t.status === 'active' && t.addedToToday);
  const top = getTopPriorityTask(todayTasks);
  const second = getSecondPriorityTask(todayTasks, top?.id || null);
  const restTasks = todayTasks
    .filter((t) => t.id !== top?.id && t.id !== second?.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const changePriority = (task: Task, p: Priority) => updateTask(task.id, { priority: p });
  const hasPriorityCards = top || second;

  const handleDragStart = (id: string) => { dragId.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (toId: string) => {
    if (dragId.current && dragId.current !== toId) {
      const reordered = reorderArray(restTasks, dragId.current, toId);
      reorderTasks(reordered.map((t) => t.id));
    }
    dragId.current = null;
    setDragOverId(null);
  };
  const handleDragEnd = () => { dragId.current = null; setDragOverId(null); };

  const getDragBorder = (taskId: string) => {
    if (dragOverId !== taskId || !dragId.current || dragId.current === taskId) return { borderTop: '2px solid transparent', borderBottom: '2px solid transparent' };
    const fromIdx = restTasks.findIndex(t => t.id === dragId.current);
    const toIdx = restTasks.findIndex(t => t.id === taskId);
    return fromIdx < toIdx
      ? { borderTop: '2px solid transparent', borderBottom: '2px solid var(--accent)' }
      : { borderTop: '2px solid var(--accent)', borderBottom: '2px solid transparent' };
  };

  const { containerRef: touchContainerRef, handleTouchStart, getTouchDragBorder, draggingId } = useTouchSortable(
    restTasks,
    (ids) => reorderTasks(ids),
    isMobile,
  );

  const handleDeleteWithConfirm = async (id: string) => {
    if (confirm('このタスクを削除しますか？')) {
      await deleteTask(id);
    }
  };

  const handleExport = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const ordered = [
      ...(top ? [top] : []),
      ...(second ? [second] : []),
      ...restTasks,
    ];
    const lines = ordered.map((t) => `- [ ] ${t.content}`).join('\n');
    const content = `${lines}\n`;
    downloadMd(`${dateStr}.md`, content);
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setBulkSaving(true);
    try {
      const listId = state.lists[0]?.id ?? '';
      for (const content of lines) {
        await addTask({ content, detail: '', priority: 'A', dueDate: null, listId, addedToToday: true });
      }
      setBulkText('');
      setShowBulkAdd(false);
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>今日のタスク</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{formatTodayHeader()}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExport} disabled={todayTasks.length === 0}>
            出力
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowBulkAdd(true)}>
            複数追加
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + タスク追加
          </button>
        </div>
      </div>

      {todayTasks.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div>今日のタスクはありません</div>
        </div>
      ) : (
        <>
          {top && (
            <PriorityCard
              task={top}
              rank="top"
              onEdit={() => setEditTask(top)}
              onComplete={() => completeTask(top.id)}
              onDelete={() => handleDeleteWithConfirm(top.id)}
              onSetTop={() => setTopPriority(top.id)}
              onSetSecond={() => setSecondPriority(top.id)}
              onChangePriority={(p) => changePriority(top, p)}
            />
          )}

          {second && (
            <PriorityCard
              task={second}
              rank="second"
              onEdit={() => setEditTask(second)}
              onComplete={() => completeTask(second.id)}
              onDelete={() => handleDeleteWithConfirm(second.id)}
              onSetTop={() => setTopPriority(second.id)}
              onSetSecond={() => setSecondPriority(second.id)}
              onChangePriority={(p) => changePriority(second, p)}
            />
          )}

          {hasPriorityCards && restTasks.length > 0 && (
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          )}

          {restTasks.length > 0 && (
            <div ref={touchContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {restTasks.map((t) => (
                <div
                  key={t.id}
                  data-sortid={t.id}
                  draggable={!isMobile}
                  onDragStart={!isMobile ? () => handleDragStart(t.id) : undefined}
                  onDragOver={!isMobile ? (e) => handleDragOver(e, t.id) : undefined}
                  onDrop={!isMobile ? () => handleDrop(t.id) : undefined}
                  onDragEnd={!isMobile ? handleDragEnd : undefined}
                  onTouchStart={isMobile ? (e) => handleTouchStart(t.id, e) : undefined}
                  style={{
                    ...(isMobile ? getTouchDragBorder(t.id) : getDragBorder(t.id)),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    opacity: draggingId === t.id ? 0.3 : 1,
                    userSelect: isMobile ? 'none' : undefined,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, cursor: isMobile ? 'default' : 'grab' }}>
                    <TaskCard task={t} onEdit={setEditTask} showRemoveFromToday showPriorityButtons />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              marginTop: 12,
              padding: '10px',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-muted)',
              fontSize: 20,
              background: 'transparent',
              cursor: 'pointer',
            }}
            title="タスクを追加"
          >＋</button>
        </>
      )}

      {(showForm || editTask) && (
        <Modal
          title={editTask ? 'タスクを編集' : 'タスクを追加'}
          onClose={() => { setShowForm(false); setEditTask(null); }}
        >
          <TaskForm
            lists={state.lists}
            task={editTask || undefined}
            defaultAddToToday
            onClose={() => { setShowForm(false); setEditTask(null); }}
          />
        </Modal>
      )}

      {showBulkAdd && (
        <Modal title="複数タスクを追加（今日）" onClose={() => { setShowBulkAdd(false); setBulkText(''); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              1行につき1タスクとして追加されます。優先度はAに設定されます。
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'タスク1\nタスク2\nタスク3'}
              rows={8}
              autoFocus
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setShowBulkAdd(false); setBulkText(''); }}>
                キャンセル
              </button>
              <button className="btn btn-primary" onClick={handleBulkAdd} disabled={bulkSaving || !bulkText.trim()}>
                {bulkSaving ? '追加中...' : `追加（${bulkText.split('\n').filter(l => l.trim()).length}件）`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Priority Card ───────────────────────────────────────────────
interface PriorityCardProps {
  task: Task;
  rank: 'top' | 'second';
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onSetTop: () => void;
  onSetSecond: () => void;
  onChangePriority: (p: Priority) => void;
}

function PriorityCard({ task, rank, onEdit, onComplete, onDelete, onSetTop, onSetSecond, onChangePriority }: PriorityCardProps) {
  const { updateTask } = useTaskContext();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isTop = rank === 'top';

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const startEditing = () => { setEditContent(task.content); setEditing(true); };
  const commitEdit = async () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== task.content) await updateTask(task.id, { content: trimmed });
    setEditing(false);
  };
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') setEditing(false);
  };

  const bgColor = isTop
    ? 'rgba(255, 110, 30, 0.10)'
    : 'rgba(220, 180, 0, 0.10)';

  return (
    <div
      style={{
        background: bgColor,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px',
        marginBottom: 10,
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <button
          style={{
            width: 22, height: 22, minHeight: 22, padding: 0, flexShrink: 0,
            border: '2px solid var(--border)', borderRadius: '50%',
            background: 'transparent', marginTop: 2, cursor: 'pointer',
          }}
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          title="完了"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <PriorityBadge priority={task.priority} onChange={onChangePriority} />
            {task.dueDate && (
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{task.dueDate}</span>
            )}
          </div>
          {editing ? (
            <input
              ref={inputRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: isTop ? 17 : 15, fontWeight: isTop ? 600 : 500, width: '100%', padding: '2px 6px' }}
            />
          ) : (
            <div
              onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
              style={{ fontSize: isTop ? 17 : 15, fontWeight: isTop ? 600 : 500, wordBreak: 'break-word' }}
            >
              {task.content}
            </div>
          )}
          {expanded && task.detail && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {task.detail}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="編集"
            style={{ fontSize: 15, padding: '4px 8px', minHeight: 36 }}
          >✎</button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onSetTop(); }}
            title={task.isTopPriority ? '最優先を解除' : '最優先に設定'}
            style={{ fontSize: 13, padding: '4px 6px', minHeight: 36, color: task.isTopPriority ? 'var(--warning)' : 'var(--text-muted)' }}
          >★</button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onSetSecond(); }}
            title={task.isSecondPriority ? '次点を解除' : '次点に設定'}
            style={{ fontSize: 13, padding: '4px 6px', minHeight: 36, color: task.isSecondPriority ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >☆</button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="削除"
            style={{ fontSize: 13, padding: '4px 6px', minHeight: 36, color: 'var(--text-muted)' }}
          >✕</button>
        </div>
      </div>
    </div>
  );
}
