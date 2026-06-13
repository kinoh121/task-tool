import { useState, useRef, useEffect } from 'react';
import type { Task, Priority } from '../../types';
import { PriorityBadge } from './PriorityBadge';
import { formatDisplayDate, todayString } from '../../utils/dateUtils';
import { useTaskContext } from '../../contexts/TaskContext';

interface Props {
  task: Task;
  onEdit?: (task: Task) => void;
  showRemoveFromToday?: boolean;
  showPriorityButtons?: boolean;
  showAddToToday?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 10, 20, 30, 40, 50];

export function TaskCard({ task, onEdit, showPriorityButtons, showAddToToday }: Props) {
  const { completeTask, deleteTask, setTopPriority, setSecondPriority, restoreTask, addToToday, updateTask, addScheduleItem } = useTaskContext();

  const handleChangePriority = (p: Priority) => updateTask(task.id, { priority: p });
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleHour, setScheduleHour] = useState(9);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    setEditContent(task.content);
    setEditing(true);
  };

  const commitEdit = async () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== task.content) {
      await updateTask(task.id, { content: trimmed });
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') setEditing(false);
  };

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

  const handleAddSchedule = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const time = `${String(scheduleHour).padStart(2, '0')}:${String(scheduleMinute).padStart(2, '0')}`;
    await addScheduleItem({ label: task.content, time, priority: task.priority, taskId: task.id });
    setShowSchedulePicker(false);
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '4px 8px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* メイン行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {task.status === 'active' && (
          <button
            style={{
              width: 18, height: 18, minHeight: 18, padding: 0, flexShrink: 0,
              border: '2px solid var(--border)', borderRadius: '50%',
              background: 'transparent', cursor: 'pointer',
            }}
            onClick={handleComplete}
            title="完了"
          />
        )}
        <PriorityBadge priority={task.priority} size="sm" onChange={task.status === 'active' ? handleChangePriority : undefined} />
        {task.dueDate && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
            {formatDisplayDate(task.dueDate)}
          </span>
        )}
        {editing ? (
          <input
            ref={inputRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{ flex: 1, fontSize: 13, fontWeight: 500, padding: '1px 6px', minWidth: 0 }}
          />
        ) : (
          <div
            onDoubleClick={(e) => { e.stopPropagation(); if (task.status === 'active') startEditing(); }}
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {task.content}
          </div>
        )}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {task.status === 'active' && onEdit && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              title="編集"
              style={{ fontSize: 13, padding: '2px 5px', minHeight: 26 }}
            >✎</button>
          )}
          {task.status === 'active' && showPriorityButtons && (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => { e.stopPropagation(); setTopPriority(task.id); }}
                title={task.isTopPriority ? '最優先を解除' : '最優先に設定'}
                style={{ fontSize: 11, padding: '2px 4px', minHeight: 26, color: task.isTopPriority ? 'var(--warning)' : 'var(--text-muted)' }}
              >★</button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => { e.stopPropagation(); setSecondPriority(task.id); }}
                title={task.isSecondPriority ? '次点を解除' : '次点に設定'}
                style={{ fontSize: 11, padding: '2px 4px', minHeight: 26, color: task.isSecondPriority ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >☆</button>
            </>
          )}
          {task.status === 'active' && showAddToToday && task.todayDate !== todayString() && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); addToToday(task.id); }}
              title="今日のリストに追加"
              style={{ fontSize: 12, padding: '2px 4px', minHeight: 26, color: 'var(--text-muted)' }}
            >＋</button>
          )}
          {task.status === 'active' && showAddToToday && task.todayDate === todayString() && (
            <span
              style={{ fontSize: 11, padding: '2px 4px', color: 'var(--accent)', alignSelf: 'center' }}
              title="今日に追加済み"
            >✓今</span>
          )}
          {/* スケジュール追加ボタン */}
          {task.status === 'active' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); setShowSchedulePicker(!showSchedulePicker); }}
              title="スケジュールに追加"
              style={{ fontSize: 12, padding: '2px 5px', minHeight: 26, color: showSchedulePicker ? 'var(--accent)' : 'var(--text-muted)' }}
            >🕐</button>
          )}
          {task.status === 'active' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDelete}
              title="削除"
              style={{ fontSize: 13, padding: '2px 5px', minHeight: 26, color: 'var(--text-muted)' }}
            >✕</button>
          )}
          {task.status === 'completed' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleRestore}
              title="元に戻す"
              style={{ fontSize: 11, padding: '2px 6px', minHeight: 26, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
            >↩ 戻す</button>
          )}
          {task.status !== 'active' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleDelete}
              title="削除"
              style={{ fontSize: 13, padding: '2px 5px', minHeight: 26, color: 'var(--text-muted)' }}
            >✕</button>
          )}
        </div>
      </div>

      {/* 時刻ピッカー */}
      {showSchedulePicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 6,
            padding: '8px 10px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>時刻</span>
          <select
            value={scheduleHour}
            onChange={(e) => setScheduleHour(Number(e.target.value))}
            style={{ width: 64, fontSize: 13, padding: '3px 4px' }}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
            ))}
          </select>
          <span style={{ color: 'var(--text-muted)' }}>:</span>
          <select
            value={scheduleMinute}
            onChange={(e) => setScheduleMinute(Number(e.target.value))}
            style={{ width: 64, fontSize: 13, padding: '3px 4px' }}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddSchedule}
            style={{ fontSize: 12, padding: '4px 10px', minHeight: 28 }}
          >追加</button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => { e.stopPropagation(); setShowSchedulePicker(false); }}
            style={{ fontSize: 12, padding: '4px 8px', minHeight: 28 }}
          >✕</button>
        </div>
      )}

      {/* 展開時：詳細 */}
      {expanded && task.detail && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', paddingLeft: 24 }}>
          {task.detail}
        </div>
      )}
    </div>
  );
}
