import { useTaskContext } from '../../contexts/TaskContext';

const HOUR_HEIGHT = 45; // px per hour
const TOTAL_HOURS = 24;

const PRIORITY_COLORS: Record<string, string> = {
  S: '#ff4757',
  A: '#ff6b35',
  B: '#4a9eff',
  C: '#2ed573',
  D: '#a0a0a0',
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function ScheduleView() {
  const { state, removeScheduleItem, clearSchedule } = useTaskContext();
  const items = state.scheduleItems;

  const handleClear = async () => {
    if (items.length === 0) return;
    if (!confirm(`スケジュールを全てクリアしますか？（${items.length}件）`)) return;
    await clearSchedule();
  };

  const totalHeight = HOUR_HEIGHT * TOTAL_HOURS;

  return (
    <div style={{ maxWidth: 480, padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>スケジュール</h1>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleClear}
          disabled={items.length === 0}
          style={{ color: 'var(--danger)', opacity: items.length === 0 ? 0.3 : 1, fontSize: 12 }}
        >
          全クリア
        </button>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', height: totalHeight, userSelect: 'none' }}>

        {/* Hour lines & labels */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, h) => (
          <div key={h} style={{ position: 'absolute', top: h * HOUR_HEIGHT, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 32, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, lineHeight: 1 }}>
              {h < 24 ? `${h}` : ''}
            </span>
            <div style={{ flex: 1, height: 1, background: h === 0 || h === 24 ? 'var(--border)' : 'var(--border)', opacity: 0.8 }} />
          </div>
        ))}

        {/* Half-hour dotted lines */}
        {Array.from({ length: TOTAL_HOURS }, (_, h) => (
          <div key={`half-${h}`} style={{
            position: 'absolute',
            top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2,
            left: 40,
            right: 0,
            height: 1,
            borderTop: '1px dotted var(--border)',
            opacity: 0.4,
          }} />
        ))}

        {/* Schedule items */}
        {items.map((item) => {
          const top = (timeToMinutes(item.time) / 60) * HOUR_HEIGHT;
          const color = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS['C'];
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top,
                left: 44,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                zIndex: 1,
              }}
            >
              {/* time label */}
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, minWidth: 32 }}>
                {item.time}
              </span>
              {/* item card */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--bg-secondary)',
                border: `1px solid ${color}44`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 12,
                color: 'var(--text-primary)',
                minHeight: 26,
                overflow: 'hidden',
              }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                <button
                  onClick={() => removeScheduleItem(item.id)}
                  style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-muted)', padding: '0 2px', lineHeight: 1 }}
                  title="削除"
                >✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
