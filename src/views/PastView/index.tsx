import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { TaskCard } from '../../components/task/TaskCard';
import { sortByPriority } from '../../utils/priorityUtils';
import { toDateString } from '../../utils/dateUtils';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MAX_DAYS_BACK = 90;
const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

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
  const { user } = useAuth();
  const { state, copyTasks, addToToday } = useTaskContext();
  const [daysBack, setDaysBack] = useState<number>(1);
  const [snapshotIds, setSnapshotIds] = useState<string[] | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = addDays(today, -daysBack);
  const targetDateStr = toDateString(targetDate);

  const canGoBack = daysBack < MAX_DAYS_BACK;
  const canGoForward = daysBack > 1;

  const handleBack = () => setDaysBack((prev) => Math.min(prev + 1, MAX_DAYS_BACK));
  const handleForward = () => setDaysBack((prev) => Math.max(prev - 1, 1));

  // 日付が変わるたびにスナップショットを取得
  useEffect(() => {
    if (DEMO || !user) return;
    setSnapshotIds(null);
    setUseFallback(false);
    setSnapshotLoading(true);
    getDoc(doc(db, 'users', user.uid, 'dailySnapshots', targetDateStr))
      .then((snap) => {
        if (snap.exists()) {
          setSnapshotIds((snap.data().taskIds as string[]) || []);
          setUseFallback(false);
        } else {
          setSnapshotIds([]);
          setUseFallback(true);
        }
      })
      .catch(() => { setSnapshotIds([]); setUseFallback(true); })
      .finally(() => setSnapshotLoading(false));
  }, [targetDateStr, user]);

  // スナップショットIDに対応するタスクを取得（status問わず）
  // スナップショットが存在しない場合は todayDate で直接フィルタ
  const tasks = snapshotIds === null
    ? []
    : useFallback
      ? sortByPriority(state.tasks.filter((t) => t.todayDate === targetDateStr))
      : sortByPriority(state.tasks.filter((t) => snapshotIds.includes(t.id)));

  const isEmpty = !snapshotLoading && tasks.length === 0;

  const handleCopyToToday = async (taskId: string) => {
    setCopyingId(taskId);
    try {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;
      // active なら addToToday、それ以外（完了済み等）は新規コピー作成
      if (task.status === 'active') {
        await addToToday(taskId);
      } else {
        await copyTasks([taskId]);
      }
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 720, padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>過去のタスク</h1>
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
          {formatDateHeader(targetDate)}
          <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
            （{daysBack}日前）
          </span>
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
      {snapshotLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
          読み込み中...
        </div>
      ) : isEmpty ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
          この日の記録はありません
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((t) => (
            <div key={t.id} style={{ position: 'relative' }}>
              <TaskCard task={t} />
              <button
                onClick={() => handleCopyToToday(t.id)}
                disabled={copyingId === t.id}
                title="今日にコピー"
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  opacity: copyingId === t.id ? 0.5 : 1,
                }}
              >
                {copyingId === t.id ? '...' : '今日へ'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
