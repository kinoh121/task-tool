import { useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from '../contexts/AppContext';
import { useTaskContext } from '../contexts/TaskContext';
import { todayString } from '../utils/dateUtils';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export function useDailyCheck() {
  const { user } = useAuth();
  const { dispatch } = useAppState();
  const { state: taskState, archiveTasks } = useTaskContext();
  const checked = useRef(false);

  useEffect(() => {
    if (DEMO || !user || checked.current || taskState.loading) return;
    checked.current = true;

    const run = async () => {
      const uid = user.uid;
      const today = todayString();
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      const lastAccess: string | null = userSnap.exists()
        ? (userSnap.data().lastAccessDate as string | null) || null
        : null;

      if (lastAccess !== today) {
        // Archive all active tasks
        const activeIds = taskState.tasks
          .filter((t) => t.status === 'active')
          .map((t) => t.id);

        if (activeIds.length > 0) {
          await archiveTasks(activeIds);
        }

        await setDoc(userRef, { email: user.email, lastAccessDate: today }, { merge: true });

        if (activeIds.length > 0) {
          dispatch({ type: 'SHOW_COPY_SCREEN' });
        }
      }
    };

    run();
  }, [user, taskState.loading]);
}
