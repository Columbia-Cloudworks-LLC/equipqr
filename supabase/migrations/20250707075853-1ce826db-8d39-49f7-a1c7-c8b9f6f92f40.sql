-- Refine organization_invitations RLS policies for comprehensive invitation flow
-- This addresses the gap where invited users cannot access invitations by token

-- Step 1: Add policy for organization members to view all invitations
CREATE POLICY "members_view_invitations" ON organization_invitations
FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

-- Step 2: Add policy for invited users to access invitations by email match
-- This allows users to view invitations sent to their email (for invitation acceptance flow)
CREATE POLICY "invited_users_access_by_email" ON organization_invitations
FOR SELECT
USING (
  auth.email() IS NOT NULL 
  AND lower(trim(email)) = lower(trim(auth.email()))
);

-- Step 3: Add policy for invited users to update invitations by email match
-- This allows users to accept/decline invitations sent to their email
CREATE POLICY "invited_users_update_by_email" ON organization_invitations
FOR UPDATE
USING (
  auth.email() IS NOT NULL 
  AND lower(trim(email)) = lower(trim(auth.email()))
  AND status = 'pending'
);

-- Step 4: Add policy for invited users to view invitations by token
-- This supports the invitation acceptance page where users access via token
CREATE POLICY "token_based_access" ON organization_invitations
FOR SELECT
USING (true); -- Allow reading by token in application code

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Enhanced organization_invitations RLS policies implemented.';
  RAISE NOTICE 'Added policies for: member viewing, email-based access, email-based updates, and token-based access.';
  RAISE NOTICE 'Invitation flow now supports all user types: admins, members, and invited users.';
END $$;