import { useRef, useState, useEffect } from 'react';

const LONG_PRESS_MS = 300;

/** スマホ向けタッチDnD並び替えhook（長押し起動 + ゴースト表示） */
export function useTouchSortable<T extends { id: string }>(
  items: T[],
  onReorder: (ids: string[]) => void,
  enabled: boolean,
) {
  const dragIdRef = useRef<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const ghostOffsetRef = useRef({ x: 0, y: 0 });

  const cleanupGhost = () => {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    const container = containerRef.current;

    const reorder = (fromId: string, toId: string) => {
      const result = [...items];
      const fromIdx = result.findIndex((t) => t.id === fromId);
      const toIdx = result.findIndex((t) => t.id === toId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      const [moved] = result.splice(fromIdx, 1);
      result.splice(toIdx, 0, moved);
      onReorder(result.map((t) => t.id));
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragIdRef.current) {
        // ドラッグ未起動中に指が動いたら長押しタイマーをキャンセル
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        return;
      }
      e.preventDefault(); // スクロール抑制（passive: false 必須）
      const touch = e.touches[0];

      // ゴーストを指に追従させる
      if (ghostRef.current) {
        ghostRef.current.style.left = `${touch.clientX - ghostOffsetRef.current.x}px`;
        ghostRef.current.style.top = `${touch.clientY - ghostOffsetRef.current.y}px`;
      }

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const taskEl = el?.closest('[data-sortid]') as HTMLElement | null;
      if (taskEl) {
        const overId = taskEl.dataset.sortid;
        if (overId && overId !== dragIdRef.current) {
          dragOverIdRef.current = overId;
          setDragOverId(overId);
        }
      }
    };

    const endDrag = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (dragIdRef.current && dragOverIdRef.current && dragIdRef.current !== dragOverIdRef.current) {
        reorder(dragIdRef.current, dragOverIdRef.current);
      }
      dragIdRef.current = null;
      dragOverIdRef.current = null;
      setDragOverId(null);
      setDraggingId(null);
      cleanupGhost();
    };

    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', endDrag);
    container.addEventListener('touchcancel', endDrag);
    return () => {
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', endDrag);
      container.removeEventListener('touchcancel', endDrag);
      cleanupGhost();
    };
  }, [enabled, items, onReorder]);

  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const sourceEl = (e.currentTarget as HTMLElement).closest('[data-sortid]') as HTMLElement | null;

    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      dragIdRef.current = id;
      setDraggingId(id);

      // 触覚フィードバック（対応デバイスのみ）
      if (navigator.vibrate) navigator.vibrate(50);

      // ゴースト生成
      if (sourceEl) {
        const rect = sourceEl.getBoundingClientRect();
        cleanupGhost();
        const ghost = sourceEl.cloneNode(true) as HTMLDivElement;
        ghost.style.cssText = [
          'position: fixed',
          `left: ${rect.left}px`,
          `top: ${rect.top}px`,
          `width: ${rect.width}px`,
          `height: ${rect.height}px`,
          'opacity: 0.85',
          'pointer-events: none',
          'z-index: 9999',
          'box-shadow: 0 8px 24px rgba(0,0,0,0.3)',
          'border-radius: 8px',
          'transform: scale(1.04)',
          'transition: transform 0.1s ease',
        ].join(';');
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
        ghostOffsetRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    }, LONG_PRESS_MS);
  };

  const getTouchDragBorder = (taskId: string) => {
    if (dragOverId !== taskId || !dragIdRef.current || dragIdRef.current === taskId)
      return { borderTop: '2px solid transparent', borderBottom: '2px solid transparent' };
    const fromIdx = items.findIndex((t) => t.id === dragIdRef.current);
    const toIdx = items.findIndex((t) => t.id === taskId);
    return fromIdx < toIdx
      ? { borderTop: '2px solid transparent', borderBottom: '2px solid var(--accent)' }
      : { borderTop: '2px solid var(--accent)', borderBottom: '2px solid transparent' };
  };

  return { containerRef, handleTouchStart, getTouchDragBorder, draggingId };
}
