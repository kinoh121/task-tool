import { useEffect, useRef } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTaskContext } from '../contexts/TaskContext';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

export function useAutoDelete() {
  const { user } = useAuth();
  const { state } = useTaskContext();
  const ran = useRef(false);

  useEffect(() => {
    if (DEMO || !user || ran.current || state.loading) return;
    ran.current = true;

    const run = async () => {
      const uid = user.uid;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);

      const toDelete = state.tasks.filter((t) => {
        if (t.status === 'completed' && t.completedAt && t.completedAt < cutoff) return true;
        if (t.status === 'archived' && t.archivedAt && t.archivedAt < cutoff) return true;
        return false;
      });

      if (toDelete.length === 0) return;

      const batch = writeBatch(db);
      for (const t of toDelete) {
        batch.delete(doc(db, 'users', uid, 'tasks', t.id));
      }
      await batch.commit();
    };

    run();
  }, [user, state.loading]);
}
