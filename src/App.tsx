import { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { AppProvider, useAppState } from './contexts/AppContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './views/LoginPage';
import { TodayView } from './views/TodayView';
import { CopySelectionView } from './views/CopySelectionView';
import { ListView } from './views/ListView';
import { CompletedView } from './views/CompletedView';
import { ArchiveView } from './views/ArchiveView';
import { PastView } from './views/PastView';
import { useDailyCheck } from './hooks/useDailyCheck';
import { useAutoDelete } from './hooks/useAutoDelete';

function AppRoutes() {
  const { user, loading } = useAuth();
  const { state } = useAppState();
  const navigate = useNavigate();

  useDailyCheck();
  useAutoDelete();

  useEffect(() => {
    if (state.showCopyScreen) {
      navigate('/copy');
    }
  }, [state.showCopyScreen]);

  if (loading) {
    return (
      <div style={{
        height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 14,
      }}>
        読み込み中...
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TodayView />} />
        <Route path="/copy" element={<CopySelectionView />} />
        <Route path="/lists" element={<ListView />} />
        <Route path="/completed" element={<CompletedView />} />
        <Route path="/archive" element={<ArchiveView />} />
        <Route path="/past" element={<PastView />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <TaskProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </TaskProvider>
      </AuthProvider>
    </HashRouter>
  );
}
