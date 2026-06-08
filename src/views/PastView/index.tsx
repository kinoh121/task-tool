import { useState } from 'react';
import { useTaskContext } from '../../contexts/TaskContext';
import { TaskCard } from '../../components/task/TaskCard';
import { sortByPriority } from '../../utils/priorityUtils';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MAX_DAYS_BACK = 90;

function isSameDay(date: Date | null, target: Date): boolean {
  if (!date) return false;
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function formatDateHeader(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = WEEKDAYS[d.getDay()];
  return `${m}月${day}日（${w}）`;
}

function addDays(base: Date, delta: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

export function PastView() {
  const { state } = useTaskContext();
  // daysBack: 2 = 一昨日, 3 = 3日前, ... MAX_DAYS_BACK
  // null = 未選択（初期状態）
  const [daysBack, setDaysBack] = useState<number | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canGoBack = daysBack === null ? true : daysBack < MAX_DAYS_BACK;
  const canGoForward = daysBack !== null && daysBack > 2;

  const handleBack = () => {
    setDaysBack((prev) => (prev === null ? 2 : Math.min(prev + 1, MAX_DAYS_BACK)));
  };

  const handleForward = () => {
    setDaysBack((prev) => {
      if (prev === null) return null;
      const next = prev - 1;
      return next < 2 ? null : next;
    });
  };

  const targetDate = daysBack !== null ? addDays(today, -daysBack) : null;

  const completed = targetDate
    ? sortByPriority(state.tasks.filter((t) => t.status === 'completed' && isSameDay(t.completedAt, targetDate)))
    : [];
  const archived = targetDate
    ? sortByPriority(state.tasks.filter((t) => t.status === 'archived' && isSameDay(t.archivedAt, targetDate)))
    : [];

  const isEmpty = completed.length === 0 && archived.length === 0;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>過去のタスク</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {targetDate ? formatDateHeader(targetDate) : '日付を選択してください'}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleBack}
          disabled={!canGoBack}
          style={{ fontSize: 16, padding: '6px 14px', minHeight: 36, opacity: canGoBack ? 1 : 0.3 }}
          title="前の日へ"
        >＜</button>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textAlign: 'center' }}>
          {targetDate ? formatDateHeader(targetDate) : '—'}
          {daysBack !== null && (
            <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
              （{daysBack}日前）
            </span>
          )}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleForward}
          disabled={!canGoForward}
          style={{ fontSize: 16, padding: '6px 14px', minHeight: 36, opacity: canGoForward ? 1 : 0.3 }}
          title="次の日へ"
        >＞</button>
      </div>

      {/* Content */}
      {targetDate === null ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>◁</div>
          <div>「＜」を押して過去の日付に移動してください</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>最大{MAX_DAYS_BACK}日前まで遡れます</div>
        </div>
      ) : isEmpty ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
          この日のタスクはありません
        </div>
      ) : (
        <>
          {completed.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
                完了したタスク
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completed.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            </section>
          )}
          {archived.length > 0 && (
            <section>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>
                持ち越したタスク
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {archived.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
