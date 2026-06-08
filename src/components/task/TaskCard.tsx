import { useState } from 'react';
import type { Task, Priority } from '../../types';
import { PriorityBadge } from './PriorityBadge';
import { formatDisplayDate } from '../../utils/dateUtils';
import { useTaskContext } from '../../contexts/TaskContext';

interface Props {
  task: Task;
  onEdit?: (task: Task) => void;
  showRemoveFromToday?: boolean;
  showPriorityButtons?: boolean;
  showAddToToday?: boolean;
}

export function TaskCard({ task, onEdit, showPriorityButtons, showAddToToday }: Props) {
  const { completeTask, deleteTask, setTopPriority, setSecondPriority, restoreTask, addToToday, updateTask } = useTaskContext();

  const handleChangePriority = (p: Priority) => updateTask(task.id, { priority: p });
  const [expanded, setExpanded] = useState(false);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask(task.id);
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await restoreTask(task.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('このタスクを削除しますか？')) {
      await deleteTask(task.id);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '12px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {task.status === 'active' && (
          <button
            style={{
              width: 22, height: 22, minHeight: 22, padding: 0, flexShrink: 0,
              border: '2px solid var(--border)', borderRadius: '50%',
              background: 'transparent', marginTop: 2, cursor: 'pointer',
            }}
            onClick={handleComplete}
            title="完了"
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <PriorityBadge priority={task.priority} size="sm" onChange={task.status === 'active' ? handleChangePriority : undefined} />
            {task.dueDate && (
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {formatDisplayDate(task.dueDate)}
              </span>
            )}
          </div>
          <div style={{
            marginTop: 4,
            fontSize: 14,
            fontWeight: 500,
            wordBreak: 'break-word',
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
            color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
          }}>
            {task.content}
          </div>
          {expanded && task.detail && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {task.detail}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {task.status === 'active' && onEdit && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              title="編集"
              style={{ fontSize: 15, padding: '4px 8px', minHeight: 36 }}
            >✎</button>
          )}
          {task.status === 'active' && showPriorityButtons && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => { e.stopPropagation(); setTopPriority(task.id); }}
                title={task.isTopPriority ? '最優先を解除' : '最優先に設定'}
                style={{ fontSize: 13, padding: '4px 6px', minHeight: 36, color: task.isTopPriority ? 'var(--warning)' : 'var(--text-muted)' }}
              >★</button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => { e.stopPropagation(); setSecondPriority(task.id); }}
                title={task.isSecondPriority ? '次点を解除' : '次点に設定'}
                style={{ fontSize: 13, padding: '4px 6px', minHeight: 36, color: task.isSecondPriority ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >☆</button>
            </>
          )}
          {task.status === 'active' && showAddToToday && !task.addedToToday && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); addToToday(task.id); }}
              title="今日のリストに追加"
              style={{ fontSize: 14, padding: '4px 6px', minHeight: 36, color: 'var(--text-muted)' }}
            >＋</button>
          )}
          {task.status === 'active' && showAddToToday && task.addedToToday && (
            <span
              style={{ fontSize: 11, padding: '4px 6px', color: 'var(--accent)', alignSelf: 'center' }}
              title="今日に追加済み"
            >✓今</span>
          )}
          {task.status === 'active' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDelete}
              title="削除"
              style={{ fontSize: 16, padding: '4px 8px', minHeight: 36, color: 'var(--text-muted)' }}
            >✕</button>
          )}
          {task.status === 'completed' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleRestore}
              title="元に戻す"
              style={{ fontSize: 12, padding: '4px 8px', minHeight: 36, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
            >↩ 戻す</button>
          )}
          {task.status !== 'active' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDelete}
              title="削除"
              style={{ fontSize: 16, padding: '4px 8px', minHeight: 36, color: 'var(--text-muted)' }}
            >✕</button>
          )}
        </div>
      </div>
    </div>
  );
}
