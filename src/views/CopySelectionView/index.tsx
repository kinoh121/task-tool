import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskContext } from '../../contexts/TaskContext';
import { useAppState } from '../../contexts/AppContext';
import { PriorityBadge } from '../../components/task/PriorityBadge';
import { sortByPriority } from '../../utils/priorityUtils';

export function CopySelectionView() {
  const { state: taskState, copyTasks } = useTaskContext();
  const { state: appState, dispatch } = useAppState();
  const navigate = useNavigate();

  // copyTaskIds で指定された ID のタスクを取得（status に関わらず）
  const tasks = sortByPriority(
    taskState.tasks.filter((t) => appState.copyTaskIds.includes(t.id))
  );

  const [selected, setSelected] = useState<Set<string>>(new Set(tasks.map((t) => t.id)));
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      if (selected.size > 0) {
        await copyTasks([...selected]);
      }
      dispatch({ type: 'HIDE_COPY_SCREEN' });
      navigate('/');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    dispatch({ type: 'HIDE_COPY_SCREEN' });
    navigate('/');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>今日にコピーするタスク</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
        昨日の「今日」にあったタスクです。今日に引き継ぐものを選んでください。
      </p>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
          引き継ぎタスクはありません
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set(tasks.map((t) => t.id)))}>全選択</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>全解除</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {tasks.map((task) => (
              <label
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${selected.has(task.id) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'border-color 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(task.id)}
                  onChange={() => toggle(task.id)}
                  style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <PriorityBadge priority={task.priority} size="sm" />
                    {task.dueDate && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{task.dueDate}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, wordBreak: 'break-word' }}>{task.content}</div>
                  {task.detail && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                      {task.detail}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={handleSkip}>スキップ</button>
        <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
          {saving ? '処理中...' : `${selected.size}件をコピー`}
        </button>
      </div>
    </div>
  );
}
