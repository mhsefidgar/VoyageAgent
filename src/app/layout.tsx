import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoyageAgent',
  description: 'Cost-aware AI travel planning for the US and Canada.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
