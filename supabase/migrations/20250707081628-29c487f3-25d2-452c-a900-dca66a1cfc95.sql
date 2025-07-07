-- Fix circular dependency by removing problematic RLS policy
-- This removes the policy that calls is_org_admin() which queries organization_members
-- and causes infinite recursion

-- Step 1: Drop the problematic policy that causes circular dependency
DROP POLICY IF EXISTS "admins_manage_members" ON organization_members;

-- Step 2: Keep the safe policy that only checks user_id = auth.uid()
-- This policy remains because it doesn't cause recursion
-- (The members_own_record policy is already in place and working)

-- Step 3: Add a comment explaining the change
COMMENT ON TABLE organization_members IS 'RLS simplified to prevent circular dependency. Admin permissions handled at application level.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: Removed circular dependency in organization_members RLS policies.';
  RAISE NOTICE 'Only members_own_record policy remains, preventing infinite recursion.';
  RAISE NOTICE 'Admin permissions should now be handled at the application level.';
END $$;