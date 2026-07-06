import { useTaskContext } from '../../contexts/TaskContext';
import { TaskCard } from '../../components/task/TaskCard';
import { groupByDate } from '../../utils/dateUtils';

export function CompletedView() {
  const { state } = useTaskContext();
  const completed = state.tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));

  const grouped = groupByDate(completed, (t) => t.completedAt);
  const dates = [...grouped.keys()].sort().reverse();

  return (
    <div style={{ maxWidth: 720, padding: '20px 24px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>完了タスク</h1>

      {completed.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
          完了タスクはありません
        </div>
      ) : (
        dates.map((date) => (
          <div key={date} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
              letterSpacing: '0.05em', marginBottom: 8,
              borderBottom: '1px solid var(--border)', paddingBottom: 6,
            }}>
              {date.replace(/-/g, '/')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(grouped.get(date) || []).map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
