import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'RaceGuard',
  description: 'Prove your API handles concurrent requests correctly',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#fff', fontFamily: 'monospace' }}>
        <nav style={{ display: 'flex', gap: '1.5rem', padding: '1rem 2rem', borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>
          <Link href="/" style={navLink}>New Test</Link>
          <Link href="/history" style={navLink}>History</Link>
          <Link href="/reproducers" style={navLink}>Reproducers</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}

const navLink: React.CSSProperties = { color: '#a78bfa', textDecoration: 'none', fontSize: '0.875rem' };
