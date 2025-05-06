import type {Metadata} from 'next';
import {GeistSans} from 'geist/font/sans';
import {GeistMono} from 'geist/font/mono';
import './globals.css';
import {ThemeProvider} from 'next-themes';

export const metadata: Metadata = {
  title: 'AudioSphere',
  description: 'Experience music like never before.',
  // Next.js can also manage icons through the metadata object,
  // but explicit link tags offer fine-grained control and are good for testing specific files.
  // icons: {
  //   icon: '/icon.png', // or an array for different sizes/types
  //   shortcut: '/shortcut-icon.png',
  //   apple: '/apple-icon.png',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Standard favicon.ico (temporarily commented out for testing PNG priority) */}
        {/* <link rel="icon" href="/favicon.ico" sizes="any" /> */}
        {/* PNG favicon as a fallback or alternative - with cache busting query */}
        <link rel="icon" href="/images/favicon2.png?v=2" type="image/png" />
        {/* SVG favicon (if you create one later) */}
        {/* <link rel="icon" href="/favicon.svg" type="image/svg+xml" /> */}
        {/* Apple touch icon (often a slightly larger, square PNG) */}
        <link rel="apple-touch-icon" href="/apple-icon.png" type="image/png" />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
