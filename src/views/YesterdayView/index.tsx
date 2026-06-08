import { useTaskContext } from '../../contexts/TaskContext';
import { TaskCard } from '../../components/task/TaskCard';
import { sortByPriority } from '../../utils/priorityUtils';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function isYesterday(date: Date | null): boolean {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

function formatYesterdayHeader(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = WEEKDAYS[d.getDay()];
  return `${m}月${day}日（${w}）`;
}

export function YesterdayView() {
  const { state } = useTaskContext();

  const completedYesterday = sortByPriority(
    state.tasks.filter((t) => t.status === 'completed' && isYesterday(t.completedAt))
  );
  const archivedYesterday = sortByPriority(
    state.tasks.filter((t) => t.status === 'archived' && isYesterday(t.archivedAt))
  );

  const isEmpty = completedYesterday.length === 0 && archivedYesterday.length === 0;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>昨日のタスク</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{formatYesterdayHeader()}</div>
      </div>

      {isEmpty ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
          昨日のタスクはありません
        </div>
      ) : (
        <>
          {completedYesterday.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
                完了したタスク
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedYesterday.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}

          {archivedYesterday.length > 0 && (
            <section>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
                持ち越したタスク
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {archivedYesterday.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
