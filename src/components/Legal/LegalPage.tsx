
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AppConfig } from '@/config/app';

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function LegalPage({ title, children, className }: LegalPageProps) {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{AppConfig.name}</h1>
        </div>
        
        <div className="text-sm text-muted-foreground">{AppConfig.version}</div>
      </header>

      <div className="container max-w-3xl py-8 px-4 md:px-8">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {children}
        </div>

        <footer className="mt-12 pt-6 border-t text-sm text-muted-foreground">
          <div className="flex justify-center gap-6">
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
          <p className="text-center mt-4">© {new Date().getFullYear()} Columbia Cloudworks LLC. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
