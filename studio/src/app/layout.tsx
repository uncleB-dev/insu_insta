import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: "보험삼촌 BEN's Studio",
  description: '한 줄 주제로 카드뉴스 9컷이 나오는 인스타 스튜디오',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full" style={{ background: 'var(--bg-primary)' }}>
      <body className="min-h-full" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--brand-accent)',
              color: 'var(--brand-accent)',
            },
          }}
        />
      </body>
    </html>
  );
}
