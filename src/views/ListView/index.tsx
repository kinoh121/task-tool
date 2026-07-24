import { useState, useRef } from 'react';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAppState } from '../../contexts/AppContext';
import { TaskCard } from '../../components/task/TaskCard';
import { TaskForm } from '../../components/task/TaskForm';
import { Modal } from '../../components/ui/Modal';
import { useTouchSortable } from '../../hooks/useTouchSortable';
import type { Task } from '../../types';

type MenuItemProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

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

function moveId(ids: string[], id: string, direction: -1 | 1) {
  const index = ids.indexOf(id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function ListView() {
  const {
    state,
    reorderTasks,
    addTask,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    addList,
    updateList,
    deleteList,
    reorderLists,
  } = useTaskContext();
  const { state: appState, dispatch } = useAppState();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingListForGroup, setAddingListForGroup] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    if (dragOverId !== taskId || !dragId.current || dragId.current === taskId) return { borderTop: '1px solid transparent', borderBottom: '1px solid transparent' };
    const fromIdx = listTasks.findIndex(t => t.id === dragId.current);
    const toIdx = listTasks.findIndex(t => t.id === taskId);
    return fromIdx < toIdx
      ? { borderTop: '1px solid transparent', borderBottom: '1px solid var(--accent)' }
      : { borderTop: '1px solid var(--accent)', borderBottom: '1px solid transparent' };
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

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    await addGroup(name);
    setNewGroupName('');
    setAddingGroup(false);
  };

  const handleAddList = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    const id = await addList(name, groupId);
    setNewListName('');
    setAddingListForGroup(null);
    dispatch({ type: 'SELECT_LIST', listId: id });
  };

  const handleEditGroup = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    const name = editGroupName.trim();
    if (!name) return;
    await updateGroup(groupId, name);
    setEditingGroupId(null);
    setEditGroupName('');
  };

  const handleEditList = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    const name = editListName.trim();
    if (!name) return;
    await updateList(listId, name);
    setEditingListId(null);
    setEditListName('');
  };

  const startEditGroup = (groupId: string, name: string) => {
    setAddingListForGroup(null);
    setEditingListId(null);
    setEditingGroupId(groupId);
    setEditGroupName(name);
  };

  const startEditList = (listId: string, name: string) => {
    setAddingListForGroup(null);
    setEditingGroupId(null);
    setEditingListId(listId);
    setEditListName(name);
  };

  const mobileIconButtonStyle = {
    width: 36,
    minWidth: 36,
    minHeight: 36,
    padding: 0,
    fontSize: 16,
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 38,
    right: 0,
    zIndex: 30,
    minWidth: 144,
    padding: 4,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  };

  const MenuItem = ({ children, onClick, disabled, danger }: MenuItemProps) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        setOpenMenuId(null);
        onClick();
      }}
      style={{
        display: 'block',
        width: '100%',
        padding: '9px 10px',
        textAlign: 'left',
        fontSize: 14,
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 4,
        background: 'transparent',
      }}
    >
      {children}
    </button>
  );

  if (!selectedList) {
    if (!isMobile) return <div style={{ flex: 1 }} />;
    return (
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>リストを選択</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setAddingGroup(true)}
            style={{ minHeight: 36, whiteSpace: 'nowrap' }}
          >
            + グループ
          </button>
        </div>

        {addingGroup && (
          <form onSubmit={handleAddGroup} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="グループ名"
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!newGroupName.trim()}>
                追加
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setNewGroupName('');
                  setAddingGroup(false);
                }}
              >
                ✕
              </button>
            </div>
          </form>
        )}

        {state.groups.map((group, groupIndex) => {
          const groupIds = state.groups.map((g) => g.id);
          const groupLists = state.lists.filter((l) => l.groupId === group.id);
          const listIds = groupLists.map((l) => l.id);
          return (
            <div key={group.id} style={{ marginBottom: 20 }}>
              {editingGroupId === group.id ? (
                <form onSubmit={(e) => handleEditGroup(e, group.id)} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!editGroupName.trim()} style={mobileIconButtonStyle}>
                      ✓
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingGroupId(null);
                        setEditGroupName('');
                      }}
                      style={mobileIconButtonStyle}
                    >
                      ✕
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, position: 'relative' }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.name}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOpenMenuId(openMenuId === `group:${group.id}` ? null : `group:${group.id}`)}
                    title="グループ操作"
                    style={{ ...mobileIconButtonStyle, color: 'var(--text-muted)' }}
                  >
                    ⋯
                  </button>
                  {openMenuId === `group:${group.id}` && (
                    <div style={menuStyle}>
                      <MenuItem onClick={() => reorderGroups(moveId(groupIds, group.id, -1))} disabled={groupIndex === 0}>上へ移動</MenuItem>
                      <MenuItem onClick={() => reorderGroups(moveId(groupIds, group.id, 1))} disabled={groupIndex === state.groups.length - 1}>下へ移動</MenuItem>
                      <MenuItem
                        onClick={() => {
                          setEditingGroupId(null);
                          setAddingListForGroup(group.id);
                        }}
                      >
                        リスト追加
                      </MenuItem>
                      <MenuItem onClick={() => startEditGroup(group.id, group.name)}>名前変更</MenuItem>
                      <MenuItem
                        danger
                        onClick={() => {
                          if (confirm(`グループ「${group.name}」を削除しますか？`)) deleteGroup(group.id);
                        }}
                      >
                        削除
                      </MenuItem>
                    </div>
                  )}
                </div>
              )}

              {addingListForGroup === group.id && (
                <form onSubmit={(e) => handleAddList(e, group.id)} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="リスト名"
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={!newListName.trim()} style={mobileIconButtonStyle}>
                      ✓
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setNewListName('');
                        setAddingListForGroup(null);
                      }}
                      style={mobileIconButtonStyle}
                    >
                      ✕
                    </button>
                  </div>
                </form>
              )}

              {groupLists.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '10px 12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                  リストがありません
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {groupLists.map((list, listIndex) => (
                    <div key={list.id}>
                      {editingListId === list.id ? (
                        <form onSubmit={(e) => handleEditList(e, list.id)}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={editListName}
                              onChange={(e) => setEditListName(e.target.value)}
                              autoFocus
                            />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={!editListName.trim()} style={mobileIconButtonStyle}>
                              ✓
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingListId(null);
                                setEditListName('');
                              }}
                              style={mobileIconButtonStyle}
                            >
                              ✕
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            overflow: 'visible',
                            position: 'relative',
                          }}
                        >
                          <button
                            onClick={() => dispatch({ type: 'SELECT_LIST', listId: list.id })}
                            style={{
                              flex: 1, minWidth: 0, textAlign: 'left', padding: '12px 16px',
                              background: 'transparent', fontSize: 14, color: 'var(--text-primary)',
                              cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                          >
                            {list.name}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setOpenMenuId(openMenuId === `list:${list.id}` ? null : `list:${list.id}`)}
                            title="リスト操作"
                            style={{ ...mobileIconButtonStyle, flexShrink: 0 }}
                          >
                            ⋯
                          </button>
                          {openMenuId === `list:${list.id}` && (
                            <div style={menuStyle}>
                              <MenuItem onClick={() => reorderLists(moveId(listIds, list.id, -1))} disabled={listIndex === 0}>上へ移動</MenuItem>
                              <MenuItem onClick={() => reorderLists(moveId(listIds, list.id, 1))} disabled={listIndex === groupLists.length - 1}>下へ移動</MenuItem>
                              <MenuItem onClick={() => startEditList(list.id, list.name)}>名前変更</MenuItem>
                              <MenuItem
                                danger
                                onClick={() => {
                                  if (confirm(`リスト「${list.name}」を削除しますか？`)) deleteList(list.id);
                                }}
                              >
                                削除
                              </MenuItem>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
            right: 16,
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
        <div ref={touchContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
