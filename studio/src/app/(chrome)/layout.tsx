import { Sidebar } from '@/components/chrome/Sidebar';
import { TopBar } from '@/components/chrome/TopBar';

export default function ChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: '56px 1fr',
        gridTemplateAreas: '"sidebar topbar" "sidebar main"',
      }}
    >
      <div style={{ gridArea: 'sidebar' }}>
        <Sidebar />
      </div>
      <TopBar />
      <main
        className="overflow-y-auto"
        style={{
          gridArea: 'main',
          padding: '32px 40px 80px',
          minWidth: 0,
          background: 'var(--bg-primary)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
