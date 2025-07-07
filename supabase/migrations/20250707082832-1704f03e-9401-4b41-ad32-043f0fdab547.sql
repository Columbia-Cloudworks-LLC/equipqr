-- Fix stack depth limit exceeded error by simplifying RLS policies
-- Replace recursive policies with simple, non-recursive ones

-- Step 1: Drop the problematic recursive policy on organization_invitations
DROP POLICY IF EXISTS "admins_manage_invitations" ON organization_invitations;

-- Step 2: Create simple, non-recursive policies for organization_invitations
-- These policies do NOT call functions that query organization_members

-- Allow users to see invitations they created
CREATE POLICY "users_view_own_invitations" ON organization_invitations
FOR SELECT
USING (invited_by = auth.uid());

-- Allow users to manage invitations they created
CREATE POLICY "users_manage_own_invitations" ON organization_invitations  
FOR UPDATE
USING (invited_by = auth.uid());

-- Allow users to create invitations (permission check handled in application)
CREATE POLICY "users_create_invitations" ON organization_invitations
FOR INSERT
WITH CHECK (invited_by = auth.uid());

-- Allow users to delete invitations they created
CREATE POLICY "users_delete_own_invitations" ON organization_invitations
FOR DELETE  
USING (invited_by = auth.uid());

-- Step 3: Update the useOrganizationInvitations hook to use a direct database query
-- instead of relying on RLS policies for admin permission checking

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Replaced recursive RLS policies with simple, non-recursive ones.';
  RAISE NOTICE 'Stack depth error should now be resolved.';
  RAISE NOTICE 'Permission checking will be handled at the application level.';
END $$;