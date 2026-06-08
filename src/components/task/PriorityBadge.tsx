import { useState, useEffect, useRef } from 'react';
import type { Priority } from '../../types';
import { PRIORITY_COLORS } from '../../utils/priorityUtils';

const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C', 'D'];

interface Props {
  priority: Priority;
  size?: 'sm' | 'md';
  onChange?: (p: Priority) => void;
}

export function PriorityBadge({ priority, size = 'md', onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const color = PRIORITY_COLORS[priority];
  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '1px 6px' : '2px 8px';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const badge = (
    <span style={{
      display: 'inline-block',
      background: color + '33',
      color,
      border: `1px solid ${color}66`,
      borderRadius: '4px',
      fontSize,
      fontWeight: 700,
      padding,
      lineHeight: 1.4,
      fontFamily: 'monospace',
      cursor: onChange ? 'pointer' : 'default',
      userSelect: 'none',
    }}>
      {priority}
    </span>
  );

  if (!onChange) return badge;

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        title="優先度を変更"
      >
        {badge}
      </span>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
          <div style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            zIndex: 200,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 44,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            {PRIORITIES.map((p) => {
              const c = PRIORITY_COLORS[p];
              return (
                <button
                  key={p}
                  onClick={(e) => { e.stopPropagation(); onChange(p); setOpen(false); }}
                  style={{
                    background: priority === p ? c + '33' : 'transparent',
                    color: c,
                    border: priority === p ? `1px solid ${c}66` : '1px solid transparent',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </>
      )}
    </span>
  );
}
