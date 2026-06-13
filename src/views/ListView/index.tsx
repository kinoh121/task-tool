import { useState, useRef } from 'react';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAppState } from '../../contexts/AppContext';
import { TaskCard } from '../../components/task/TaskCard';
import { TaskForm } from '../../components/task/TaskForm';
import { Modal } from '../../components/ui/Modal';
import { useTouchSortable } from '../../hooks/useTouchSortable';
import type { Task } from '../../types';

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

export function ListView() {
  const { state, reorderTasks, addTask } = useTaskContext();
  const { state: appState, dispatch } = useAppState();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const selectedList = state.lists.find((l) => l.id === appState.selectedListId);
  const listTasks = appState.selectedListId
    ? state.tasks
        .filter((t) => t.listId === appState.selectedListId && t.status === 'active' && t.todayDate === null)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  const handleDragStart = (id: string) => { dragId.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (toId: string) => {
    if (dragId.current && dragId.current !== toId) {
      const reordered = reorderArray(listTasks, dragId.current, toId);
      reorderTasks(reordered.map((t) => t.id));
    }
    dragId.current = null;
    setDragOverId(null);
  };
  const handleDragEnd = () => { dragId.current = null; setDragOverId(null); };

  const getDragBorder = (taskId: string) => {
    if (dragOverId !== taskId || !dragId.current || dragId.current === taskId) return { borderTop: '2px solid transparent', borderBottom: '2px solid transparent' };
    const fromIdx = listTasks.findIndex(t => t.id === dragId.current);
    const toIdx = listTasks.findIndex(t => t.id === taskId);
    return fromIdx < toIdx
      ? { borderTop: '2px solid transparent', borderBottom: '2px solid var(--accent)' }
      : { borderTop: '2px solid var(--accent)', borderBottom: '2px solid transparent' };
  };

  const { containerRef: touchContainerRef, handleTouchStart, getTouchDragBorder, draggingId } = useTouchSortable(
    listTasks,
    (ids) => reorderTasks(ids),
    isMobile,
  );

  const handleExport = () => {
    if (!selectedList) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lines = listTasks.map((t) => `- [ ] ${t.content}`).join('\n');
    const content = `${lines}\n`;
    downloadMd(`${selectedList.name}_${dateStr}.md`, content);
  };

  const handleBulkAdd = async () => {
    if (!appState.selectedListId) return;
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setBulkSaving(true);
    try {
      for (const content of lines) {
        await addTask({ content, detail: '', priority: 'A', dueDate: null, listId: appState.selectedListId, todayDate: null });
      }
      setBulkText('');
      setShowBulkAdd(false);
    } finally {
      setBulkSaving(false);
    }
  };

  if (!selectedList) {
    if (!isMobile) return <div style={{ flex: 1 }} />;
    return (
      <div style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>リストを選択</h2>
        {state.groups.map((group) => {
          const groupLists = state.lists.filter((l) => l.groupId === group.id);
          if (groupLists.length === 0) return null;
          return (
            <div key={group.id} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {groupLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => dispatch({ type: 'SELECT_LIST', listId: list.id })}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {state.groups.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            リストがありません
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxWidth: 720 }}>
      {/* モバイル：左下固定の戻るボタン */}
      {isMobile && (
        <button
          onClick={() => dispatch({ type: 'SELECT_LIST', listId: null })}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 12px)',
            left: 16,
            zIndex: 100,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 16px',
            fontSize: 14,
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow)',
          }}
        >← 戻る</button>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{selectedList.name}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExport} disabled={listTasks.length === 0}>
            出力
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowBulkAdd(true)}>
            複数追加
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(true)}>
            + タスク追加
          </button>
        </div>
      </div>

      {listTasks.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
          タスクはありません
        </div>
      ) : (
        <div ref={touchContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {listTasks.map((t) => (
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
                opacity: isMobile ? (draggingId === t.id ? 0.3 : 1) : (dragId.current === t.id ? 0.4 : 1),
                ...(isMobile ? getTouchDragBorder(t.id) : getDragBorder(t.id)),
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                userSelect: isMobile ? 'none' : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0, cursor: isMobile ? 'default' : 'grab' }}>
                <TaskCard task={t} onEdit={setEditTask} showAddToToday />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowTaskForm(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', marginTop: 12, padding: '10px',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-muted)', fontSize: 20,
          background: 'transparent', cursor: 'pointer',
        }}
        title="タスクを追加"
      >＋</button>

      {(showTaskForm || editTask) && (
        <Modal
          title={editTask ? 'タスクを編集' : 'タスクを追加'}
          onClose={() => { setShowTaskForm(false); setEditTask(null); }}
        >
          <TaskForm
            lists={state.lists}
            defaultListId={appState.selectedListId || undefined}
            task={editTask || undefined}
            onClose={() => { setShowTaskForm(false); setEditTask(null); }}
          />
        </Modal>
      )}

      {showBulkAdd && (
        <Modal title="複数タスクを追加" onClose={() => { setShowBulkAdd(false); setBulkText(''); }}>
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
