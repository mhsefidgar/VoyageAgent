import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VoyageAgent | Smarter travel planning',
  description: 'Plan trips, discover stays, and organize your travel with VoyageAgent.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
