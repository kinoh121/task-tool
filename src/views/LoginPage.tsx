import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      padding: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>TaskTool</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          個人用タスク管理アプリ
        </p>
      </div>
      <button
        className="btn btn-primary"
        onClick={signIn}
        style={{ fontSize: 16, padding: '14px 32px' }}
      >
        Google でログイン
      </button>
    </div>
  );
}
