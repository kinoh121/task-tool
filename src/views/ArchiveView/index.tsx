import { useState } from 'react';
import { useTaskContext } from '../../contexts/TaskContext';
import { PriorityBadge } from '../../components/task/PriorityBadge';
import { groupByDate } from '../../utils/dateUtils';
import { sortByPriority } from '../../utils/priorityUtils';

export function ArchiveView() {
  const { state, copyTasks, deleteTask } = useTaskContext();
  const [copying, setCopying] = useState<string | null>(null);

  const archived = state.tasks
    .filter((t) => t.status === 'archived')
    .sort((a, b) => (b.archivedAt?.getTime() || 0) - (a.archivedAt?.getTime() || 0));

  const grouped = groupByDate(archived, (t) => t.archivedAt);
  const dates = [...grouped.keys()].sort().reverse();

  const handleCopy = async (id: string) => {
    setCopying(id);
    try {
      await copyTasks([id]);
    } finally {
      setCopying(null);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>アーカイブ</h1>

      {archived.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
          アーカイブはありません
        </div>
      ) : (
        dates.map((date) => {
          const tasks = sortByPriority(grouped.get(date) || []);
          return (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                letterSpacing: '0.05em', marginBottom: 8,
                borderBottom: '1px solid var(--border)', paddingBottom: 6,
              }}>
                {date.replace(/-/g, '/')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <PriorityBadge priority={task.priority} size="sm" />
                        {task.dueDate && (
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{task.dueDate}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, wordBreak: 'break-word', color: 'var(--text-secondary)' }}>
                        {task.content}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleCopy(task.id)}
                        disabled={copying === task.id}
                        style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                        title="今日にコピー"
                      >
                        {copying === task.id ? '...' : '↑今日へ'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (confirm('このタスクを削除しますか？')) deleteTask(task.id);
                        }}
                        style={{ fontSize: 13, padding: '4px 8px', minHeight: 36, color: 'var(--text-muted)' }}
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
