
/**
 * Service for team notifications and invitations
 */

import { retry } from "@/utils/edgeFunctions/retry";

// Re-export the functions from the new location
export { getPendingInvitationsForUser, getActiveInvitations } from "./invitation/invitationQueries";
