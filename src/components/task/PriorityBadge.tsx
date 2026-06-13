import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Priority } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../utils/priorityUtils';

const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C', 'D', 'none'];

interface Props {
  priority: Priority;
  size?: 'sm' | 'md';
  onChange?: (p: Priority) => void;
}

export function PriorityBadge({ priority, size = 'md', onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top?: number; bottom?: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const color = PRIORITY_COLORS[priority];
  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '1px 6px' : '2px 8px';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        dropRef.current && !dropRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label = PRIORITY_LABELS[priority];
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
      minWidth: size === 'sm' ? '22px' : '26px',
      textAlign: 'center',
    }}>
      {label}
    </span>
  );

  if (!onChange) return badge;

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={(e) => {
          e.stopPropagation();
          if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const dropdownHeight = PRIORITIES.length * 36 + 8;
            const goUp = rect.bottom + dropdownHeight > window.innerHeight - 8;
            setDropPos(goUp
              ? { bottom: window.innerHeight - rect.top + 4, left: rect.left }
              : { top: rect.bottom + 4, left: rect.left }
            );
          }
          setOpen((v) => !v);
        }}
        title="優先度を変更"
      >
        {badge}
      </span>
      {open && createPortal(
        <div ref={dropRef} style={{
            position: 'fixed',
            top: dropPos.top,
            bottom: dropPos.bottom,
            left: dropPos.left,
            zIndex: 10000,
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
              const lbl = PRIORITY_LABELS[p] || '−';
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
                    minWidth: 36,
                  }}
                >
                  {lbl}
                </button>
              );
            })}
        </div>,
        document.body
      )}
    </span>
  );
}
