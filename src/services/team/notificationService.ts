
/**
 * Service for team notifications and invitations
 */

import { retry } from "@/utils/edgeFunctions/retry";

// Re-export the notification functions
export { 
  hasActiveNotifications,
  dismissNotification,
  clearLocalDismissedNotifications
} from "./notification/notificationHelpers";

// Re-export the invitation query functions - renamed to avoid duplicates
export { 
  getPendingInvitationsForUser, 
  // Rename to avoid conflict
  getActiveInvitations as fetchActiveInvitations 
} from "./invitation/invitationQueries";
