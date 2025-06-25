import type { ReactNode } from 'react';
import  '../globals.css';
import { AuthProvider } from '@/context/AuthContext';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <AuthProvider>
      {children}
      </AuthProvider>
    </div>
  );
}
