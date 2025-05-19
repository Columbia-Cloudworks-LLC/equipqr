
import React, { createContext, useContext } from 'react';
import { useNotificationsState } from '@/hooks/useNotificationsState';
import { NotificationsContextType } from '@/types/notifications';

// Export the context so it can be imported in useNotificationsSafe
export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const notificationsState = useNotificationsState();

  return (
    <NotificationsContext.Provider value={notificationsState}>
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
