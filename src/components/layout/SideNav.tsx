import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAppState } from '../../contexts/AppContext';

export function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSignOut } = useAuth();
  const { state: taskState, addGroup, addList, deleteGroup, deleteList } = useTaskContext();
  const { state: appState, dispatch } = useAppState();

  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingListForGroup, setAddingListForGroup] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');

  const isActive = (path: string) => location.pathname === path;

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

        {taskState.groups.map((group) => {
          const groupLists = taskState.lists.filter((l) => l.groupId === group.id);
          const isOpen = (appState.openGroupIds ?? []).includes(group.id);

          return (
            <div key={group.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_GROUP', groupId: group.id })}
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
                  <span style={{ flex: 1 }}>{group.name}</span>
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAddingListForGroup(group.id)}
                  title="リスト追加"
                  style={{ fontSize: 14, padding: '2px 6px', minHeight: 28, color: 'var(--text-muted)' }}
                >+</button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (confirm(`グループ「${group.name}」を削除しますか？`)) deleteGroup(group.id);
                  }}
                  title="グループ削除"
                  style={{ fontSize: 12, padding: '2px 6px', minHeight: 28, color: 'var(--text-muted)', marginRight: 4 }}
                >✕</button>
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

              {isOpen && groupLists.map((list) => {
                const listActive = appState.selectedListId === list.id && isActive('/lists');
                return (
                  <div key={list.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        dispatch({ type: 'SELECT_LIST', listId: list.id });
                        navigate('/lists');
                      }}
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
                      {list.name}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (confirm(`リスト「${list.name}」を削除しますか？`)) deleteList(list.id);
                      }}
                      title="リスト削除"
                      style={{ fontSize: 12, padding: '2px 6px', minHeight: 28, color: 'var(--text-muted)', marginRight: 4 }}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {navItem('/completed', '完了')}
      {navItem('/past', '過去')}
      {navItem('/archive', 'アーカイブ')}

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
