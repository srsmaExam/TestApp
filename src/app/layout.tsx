import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BRAND } from '@/config/branding';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.orgName} — ${BRAND.productName}`,
    template: `%s · ${BRAND.orgName}`,
  },
  description: `${BRAND.productName} for ${BRAND.orgName}. Local build.`,
  icons: {
    icon: [{ url: '/brand/SRSMALogo.jpeg', type: 'image/jpeg' }],
    shortcut: '/brand/SRSMALogo.jpeg',
    apple: '/brand/SRSMALogo.jpeg',
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.primary,
  width: 'device-width',
  initialScale: 1,
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || ((!saved || saved === 'system') && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/jpeg" href="/brand/SRSMALogo.jpeg" />
        <link rel="shortcut icon" href="/brand/SRSMALogo.jpeg" />
        <link rel="apple-touch-icon" href="/brand/SRSMALogo.jpeg" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>

      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
