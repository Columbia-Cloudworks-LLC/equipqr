
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getActiveNotifications, dismissNotification } from '@/services/team/notificationService';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationsContextType {
  invitations: any[];
  isLoading: boolean;
  hasNewNotifications: boolean;
  refreshNotifications: () => Promise<void>;
  dismissInvitation: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const { user, session } = useAuth();
  
  // Fetch notifications when authentication state changes
  useEffect(() => {
    if (user && session) {
      refreshNotifications();
    } else {
      // Reset state when user logs out
      setInvitations([]);
      setHasNewNotifications(false);
    }
  }, [user, session]);

  // Setup periodic check for new notifications (every 5 minutes)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshNotifications();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const refreshNotifications = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await getActiveNotifications();
      setInvitations(data);
      setHasNewNotifications(data.length > 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissInvitation = (id: string) => {
    dismissNotification(id);
    setInvitations(invitations.filter(inv => inv.id !== id));
    setHasNewNotifications(invitations.length > 1);
  };

  return (
    <NotificationsContext.Provider
      value={{
        invitations,
        isLoading,
        hasNewNotifications,
        refreshNotifications,
        dismissInvitation
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
