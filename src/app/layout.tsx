import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PeerApply Nexus — Collaborative Student Job Tracker & Hub',
  description:
    'A high-tempo collaborative job hunting and tracking platform for student groups. Share WhatsApp forwards, hiring posters, and track who applied with live peer sync.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
