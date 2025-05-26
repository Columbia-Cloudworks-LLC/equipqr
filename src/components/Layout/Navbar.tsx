
import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { AppConfig } from '@/config/app';
import { UserMenu } from './UserMenu';
import { NotificationsDropdown } from '@/components/Notifications/NotificationsDropdown';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              {AppConfig.name}
            </span>
          </Link>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-xs text-muted-foreground">
            {AppConfig.version}
          </span>
          
          {user && (
            <>
              <NotificationsDropdown />
              <UserMenu />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
