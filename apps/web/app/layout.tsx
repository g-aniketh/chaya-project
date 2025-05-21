import type { Metadata } from 'next';
import '@workspace/ui/globals.css';
import { ThemeProvider } from './providers/theme-provider';
export const metadata: Metadata = {
  title: 'Chaya App',
  description: 'Agricultural Management Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
