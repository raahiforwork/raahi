import type { ReactNode } from 'react';
import  '../globals.css';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      {children}
    </div>
  );
}
