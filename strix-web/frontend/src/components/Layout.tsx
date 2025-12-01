import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/scans', label: 'Scan History', icon: '📋' },
    { path: '/new', label: 'New Scan', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen bg-strix-bg text-strix-text-primary">
      {/* Header */}
      <header className="border-b border-strix-border bg-strix-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🦉</span>
            <span className="text-xl font-bold text-accent-green">STRIX</span>
          </Link>

          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  location.pathname === item.path
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'text-strix-text-secondary hover:text-strix-text-primary hover:bg-strix-border/50'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="h-[calc(100vh-57px)]">
        <Outlet />
      </main>
    </div>
  );
}
