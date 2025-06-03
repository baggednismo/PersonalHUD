import { AuthGuard } from '@/components/auth/AuthGuard';
import type React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <main className="h-screen flex flex-col">{children}</main>
    </AuthGuard>
  );
}
