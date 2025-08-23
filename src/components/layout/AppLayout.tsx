
import React from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      <aside className="w-0 md:w-64 border-r border-border">
        <div className="p-4 hidden md:block">
          <AppSidebar />
        </div>
      </aside>
      <main className="flex-1">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
};
