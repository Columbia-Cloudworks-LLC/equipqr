
/**
 * Service for team notifications and invitations
 */

import { retry } from "@/utils/edgeFunctions/retry";

// Re-export the notification functions
export { 
  getActiveNotifications,
  dismissNotification,
  clearLocalDismissedNotifications
} from "./notification/notificationHelpers";

// Re-export the invitation query functions
export { getPendingInvitationsForUser, getActiveInvitations } from "./invitation/invitationQueries";
