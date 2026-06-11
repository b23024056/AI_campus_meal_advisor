import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'AI Campus Meal Advisor',
  description: 'Campus meal recommendation app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
