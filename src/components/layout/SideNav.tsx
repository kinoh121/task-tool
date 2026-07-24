import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAppState } from '../../contexts/AppContext';

const LONG_PRESS_MS = 500;

type MenuItemProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

function moveId(ids: string[], id: string, direction: -1 | 1) {
  const index = ids.indexOf(id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

/** 長押し用ハンドラを返す（通常関数 — フックではないのでmap内でも使用可）*/
function makeLongPress(onLongPress: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const start = () => { timer = setTimeout(() => { onLongPress(); timer = null; }, LONG_PRESS_MS); };
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  return {
    onTouchStart: (e: React.TouchEvent) => { e.stopPropagation(); start(); },
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onTouchCancel: cancel,
  };
}

export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSignOut } = useAuth();
  const {
    state: taskState,
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

  const initialOpenDone = useRef(false);
  useEffect(() => {
    if (initialOpenDone.current || taskState.groups.length === 0) return;
    initialOpenDone.current = true;
    for (const group of taskState.groups) {
      if (!(appState.openGroupIds ?? []).includes(group.id)) {
        dispatch({ type: 'TOGGLE_GROUP', groupId: group.id });
      }
    }
  }, [taskState.groups]);

  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingListForGroup, setAddingListForGroup] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 30,
    right: 4,
    zIndex: 20,
    minWidth: 128,
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
        padding: '7px 9px',
        textAlign: 'left',
        fontSize: 12,
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

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await addGroup(newGroupName.trim());
    setNewGroupName('');
    setAddingGroup(false);
  };

  const handleAddList = async (e: React.FormEvent, groupId: string) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const id = await addList(newListName.trim(), groupId);
    setNewListName('');
    setAddingListForGroup(null);
    dispatch({ type: 'SELECT_LIST', listId: id });
    if (!(appState.openGroupIds ?? []).includes(groupId)) {
      dispatch({ type: 'TOGGLE_GROUP', groupId });
    }
    navigate('/lists');
  };

  const handleEditGroup = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editGroupName.trim()) return;
    await updateGroup(id, editGroupName.trim());
    setEditingGroupId(null);
  };

  const handleEditList = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editListName.trim()) return;
    await updateList(id, editListName.trim());
    setEditingListId(null);
  };

  const navItem = (path: string, label: string) => (
    <button
      key={path}
      onClick={() => navigate(path)}
      style={{
        padding: '9px 20px',
        textAlign: 'left',
        fontSize: 14,
        width: '100%',
        color: isActive(path) ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive(path) ? 'var(--accent)11' : 'transparent',
        borderLeft: `3px solid ${isActive(path) ? 'var(--accent)' : 'transparent'}`,
        transition: 'all 0.15s',
        minHeight: 40,
        userSelect: 'none',
      }}
    >
      {label}
    </button>
  );

  return (
    <nav style={{
      width: 200,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      <div style={{ padding: '16px 20px 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
        TaskTool
      </div>

      {navItem('/', '今日')}

      {/* リスト（ツリー表示） */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/lists')}
            style={{
              flex: 1,
              padding: '9px 20px',
              textAlign: 'left',
              fontSize: 14,
              color: isActive('/lists') ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive('/lists') ? 'var(--accent)11' : 'transparent',
              borderLeft: `3px solid ${isActive('/lists') ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.15s',
              minHeight: 40,
              userSelect: 'none',
            }}
          >
            リスト
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setAddingGroup(true)}
            title="グループ追加"
            style={{ fontSize: 16, padding: '4px 10px', minHeight: 40, color: 'var(--text-muted)', marginRight: 4 }}
          >+</button>
        </div>

        {addingGroup && (
          <form onSubmit={handleAddGroup} style={{ padding: '4px 12px 8px 20px' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="グループ名"
                autoFocus
                style={{ flex: 1, fontSize: 12, padding: '5px 8px' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '5px 8px', minHeight: 28, fontSize: 11 }}>追加</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingGroup(false)} style={{ minHeight: 28, fontSize: 11 }}>✕</button>
            </div>
          </form>
        )}

        {taskState.groups.map((group, groupIndex) => {
          const groupLists = taskState.lists.filter((l) => l.groupId === group.id);
          const isOpen = (appState.openGroupIds ?? []).includes(group.id);
          const groupIds = taskState.groups.map((g) => g.id);
          const listIds = groupLists.map((l) => l.id);

          const startGroupEdit = () => { setEditingGroupId(group.id); setEditGroupName(group.name); };
          const groupLongPress = makeLongPress(startGroupEdit);

          return (
            <div key={group.id}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                {editingGroupId === group.id ? (
                  <form onSubmit={(e) => handleEditGroup(e, group.id)} style={{ flex: 1, padding: '4px 8px 4px 28px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        autoFocus
                        style={{ flex: 1, fontSize: 12, padding: '4px 6px' }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '4px 6px', minHeight: 24, fontSize: 11 }}>✓</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingGroupId(null)} style={{ minHeight: 24, fontSize: 11 }}>✕</button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_GROUP', groupId: group.id })}
                    onDoubleClick={startGroupEdit}
                    {...groupLongPress}
                    title="ダブルクリック（長押し）でグループ名を変更"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px 6px 28px',
                      textAlign: 'left',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      minHeight: 32,
                      transition: 'color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 9 }}>{isOpen ? '▼' : '▶'}</span>
                    <span style={{ flex: 1, userSelect: 'text' }}>{group.name}</span>
                  </button>
                )}
                {editingGroupId !== group.id && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setOpenMenuId(openMenuId === `group:${group.id}` ? null : `group:${group.id}`)}
                    title="グループ操作"
                    style={{ fontSize: 16, padding: '2px 8px', minHeight: 28, color: 'var(--text-muted)', marginRight: 4 }}
                  >⋯</button>
                )}
                {openMenuId === `group:${group.id}` && editingGroupId !== group.id && (
                  <div style={menuStyle}>
                    <MenuItem onClick={() => reorderGroups(moveId(groupIds, group.id, -1))} disabled={groupIndex === 0}>上へ移動</MenuItem>
                    <MenuItem onClick={() => reorderGroups(moveId(groupIds, group.id, 1))} disabled={groupIndex === taskState.groups.length - 1}>下へ移動</MenuItem>
                    <MenuItem onClick={() => setAddingListForGroup(group.id)}>リスト追加</MenuItem>
                    <MenuItem onClick={startGroupEdit}>名前変更</MenuItem>
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

              {addingListForGroup === group.id && (
                <form onSubmit={(e) => handleAddList(e, group.id)} style={{ padding: '4px 8px 8px 32px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="リスト名"
                      autoFocus
                      style={{ flex: 1, fontSize: 12, padding: '5px 8px' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '5px 6px', minHeight: 28, fontSize: 11 }}>追加</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingListForGroup(null)} style={{ minHeight: 28, fontSize: 11 }}>✕</button>
                  </div>
                </form>
              )}

              {isOpen && groupLists.map((list, listIndex) => {
                const listActive = appState.selectedListId === list.id && isActive('/lists');
                const startListEdit = () => { setEditingListId(list.id); setEditListName(list.name); };
                const listLongPress = makeLongPress(startListEdit);

                return (
                  <div key={list.id} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    {editingListId === list.id ? (
                      <form onSubmit={(e) => handleEditList(e, list.id)} style={{ flex: 1, padding: '4px 8px 4px 40px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            value={editListName}
                            onChange={(e) => setEditListName(e.target.value)}
                            autoFocus
                            style={{ flex: 1, fontSize: 12, padding: '4px 6px' }}
                          />
                          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '4px 6px', minHeight: 24, fontSize: 11 }}>✓</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingListId(null)} style={{ minHeight: 24, fontSize: 11 }}>✕</button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          dispatch({ type: 'SELECT_LIST', listId: list.id });
                          navigate('/lists');
                        }}
                        onDoubleClick={startListEdit}
                        {...listLongPress}
                        title="ダブルクリック（長押し）でリスト名を変更"
                        style={{
                          flex: 1,
                          display: 'block',
                          padding: '6px 8px 6px 40px',
                          textAlign: 'left',
                          fontSize: 13,
                          color: listActive ? 'var(--accent)' : 'var(--text-secondary)',
                          background: listActive ? 'var(--accent)0d' : 'transparent',
                          borderLeft: `2px solid ${listActive ? 'var(--accent)' : 'transparent'}`,
                          minHeight: 34,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ userSelect: 'text' }}>{list.name}</span>
                      </button>
                    )}
                    {editingListId !== list.id && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setOpenMenuId(openMenuId === `list:${list.id}` ? null : `list:${list.id}`)}
                        title="リスト操作"
                        style={{ fontSize: 16, padding: '2px 8px', minHeight: 28, color: 'var(--text-muted)', marginRight: 4 }}
                      >⋯</button>
                    )}
                    {openMenuId === `list:${list.id}` && editingListId !== list.id && (
                      <div style={menuStyle}>
                        <MenuItem onClick={() => reorderLists(moveId(listIds, list.id, -1))} disabled={listIndex === 0}>上へ移動</MenuItem>
                        <MenuItem onClick={() => reorderLists(moveId(listIds, list.id, 1))} disabled={listIndex === groupLists.length - 1}>下へ移動</MenuItem>
                        <MenuItem onClick={startListEdit}>名前変更</MenuItem>
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
                );
              })}
            </div>
          );
        })}
      </div>

      {navItem('/schedule', 'スケジュール')}
      {navItem('/completed', '完了')}
      {navItem('/past', '過去')}

      <div style={{ flex: 1 }} />

      <button
        className="btn btn-ghost btn-sm"
        onClick={handleSignOut}
        style={{ margin: '8px 12px', textAlign: 'left' }}
      >
        ログアウト
      </button>
    </nav>
  );
}
