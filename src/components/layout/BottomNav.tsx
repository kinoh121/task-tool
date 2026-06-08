import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', label: '今日', icon: '○' },
  { path: '/lists', label: 'リスト', icon: '≡' },
  { path: '/completed', label: '完了', icon: '✓' },
  { path: '/archive', label: 'アーカイブ', icon: '□' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: `calc(var(--nav-height) + var(--safe-bottom))`,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 50,
      paddingBottom: 'var(--safe-bottom)',
    }}>
      {TABS.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: 11,
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 0.15s',
              minHeight: 'var(--nav-height)',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
