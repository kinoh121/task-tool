import { useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from '../contexts/AppContext';
import { useTaskContext } from '../contexts/TaskContext';
import { todayString, yesterdayString } from '../utils/dateUtils';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// モジュールレベル：アプリ全体で自動チェックは1回のみ
let autoCheckDone = false;

export function useDailyCheck() {
  const { user } = useAuth();
  const { state: appState, dispatch } = useAppState();
  const { state: taskState, saveDailySnapshot, getDailySnapshot } = useTaskContext();

  /**
   * 引き継ぎフロー:
   * 1. todayDate === 昨日 のタスクIDでスナップショットを保存（べき等）
   * 2. lastCopyDate を今日に更新
   * 3. コピー選択画面を表示
   *
   * タスクのクリアは不要。todayDate が昨日のタスクは今日ビューに表示されない。
   */
  const triggerCopyFlow = async () => {
    if (!user) return;
    // すでにコピー画面が表示中なら何もしない
    if (appState.showCopyScreen) return;
    const uid = user.uid;
    const today = todayString();
    const yesterday = yesterdayString();

    // 昨日の日付に todayDate が設定されているタスクを取得
    const prevTasks = taskState.tasks.filter((t) => t.todayDate === yesterday);
    const prevIds = prevTasks.map((t) => t.id);

    // 昨日のスナップショットが未保存なら保存（べき等）
    const existing = await getDailySnapshot(yesterday);
    if (existing === null) {
      await saveDailySnapshot(yesterday, prevIds);
    }
    const snapshotIds = existing ?? prevIds;

    // lastCopyDate を更新
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { email: user.email, lastCopyDate: today }, { merge: true });

    // コピー選択画面を表示（タスクのクリアは画面側で行う）
    dispatch({ type: 'SHOW_COPY_SCREEN', taskIds: snapshotIds });
  };

  // アプリ起動時の自動チェック（AM6時以降 + 日付変化）— アプリ全体で1回のみ
  useEffect(() => {
    if (DEMO || !user || autoCheckDone || taskState.loading) return;
    autoCheckDone = true;

    const run = async () => {
      const uid = user.uid;
      const today = todayString();
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const lastCopyDate = userSnap.exists()
        ? (userSnap.data().lastCopyDate as string | null) || null
        : null;

      if (lastCopyDate !== today) {
        const hour = new Date().getHours();
        if (hour >= 6) {
          await triggerCopyFlow();
        }
      }
    };

    run();
  }, [user, taskState.loading]);

  return { triggerCopyFlow };
}
