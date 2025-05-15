
-- Make sure equipment_attributes have proper RLS policies to match our role structure

-- First, enable row level security if not already enabled
ALTER TABLE IF EXISTS public.equipment_attributes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to start fresh
DROP POLICY IF EXISTS "Users can view equipment attributes" ON public.equipment_attributes;
DROP POLICY IF EXISTS "Users can edit equipment attributes" ON public.equipment_attributes;
DROP POLICY IF EXISTS "Users can delete equipment attributes" ON public.equipment_attributes;
DROP POLICY IF EXISTS "Users can insert equipment attributes" ON public.equipment_attributes;

-- Create policy for viewing attributes - Managers, Technicians, and Owners can view
CREATE POLICY "Users can view equipment attributes" ON public.equipment_attributes
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = equipment_attributes.equipment_id
          AND (
            -- Same org gives access
            EXISTS (
              SELECT 1 FROM public.user_profiles up
              WHERE up.id = auth.uid()
                AND up.org_id = e.org_id
            )
            OR
            -- Team membership gives access
            EXISTS (
              SELECT 1 FROM public.team t
              JOIN public.team_member tm ON tm.team_id = t.id
              JOIN public.team_roles tr ON tr.team_member_id = tm.id
              JOIN public.app_user au ON tm.user_id = au.id
              WHERE t.id = e.team_id
                AND au.auth_uid = auth.uid()
                AND tr.role IN ('manager', 'technician', 'owner', 'viewer', 'creator')
            )
          )
      )
    );

-- Policy for editing attributes - only Managers, Owners and creators
CREATE POLICY "Users can edit equipment attributes" ON public.equipment_attributes
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = equipment_attributes.equipment_id
          AND (
            -- Same org with proper role gives edit access
            EXISTS (
              SELECT 1 FROM public.user_profiles up
              JOIN public.user_roles ur ON ur.user_id = up.id AND ur.org_id = up.org_id
              WHERE up.id = auth.uid()
                AND up.org_id = e.org_id
                AND ur.role IN ('owner', 'manager')
            )
            OR
            -- Team membership with proper role gives edit access
            EXISTS (
              SELECT 1 FROM public.team t
              JOIN public.team_member tm ON tm.team_id = t.id
              JOIN public.team_roles tr ON tr.team_member_id = tm.id
              JOIN public.app_user au ON tm.user_id = au.id
              WHERE t.id = e.team_id
                AND au.auth_uid = auth.uid()
                AND tr.role IN ('manager', 'owner', 'creator')
            )
          )
      )
    );

-- Policy for inserting new attributes - same rules as edit
CREATE POLICY "Users can insert equipment attributes" ON public.equipment_attributes
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = equipment_attributes.equipment_id
          AND (
            -- Same org with proper role gives insert access
            EXISTS (
              SELECT 1 FROM public.user_profiles up
              JOIN public.user_roles ur ON ur.user_id = up.id AND ur.org_id = up.org_id
              WHERE up.id = auth.uid()
                AND up.org_id = e.org_id
                AND ur.role IN ('owner', 'manager')
            )
            OR
            -- Team membership with proper role gives insert access
            EXISTS (
              SELECT 1 FROM public.team t
              JOIN public.team_member tm ON tm.team_id = t.id
              JOIN public.team_roles tr ON tr.team_member_id = tm.id
              JOIN public.app_user au ON tm.user_id = au.id
              WHERE t.id = e.team_id
                AND au.auth_uid = auth.uid()
                AND tr.role IN ('manager', 'owner', 'creator')
            )
          )
      )
    );

-- Policy for deleting attributes - same rules as edit and insert
CREATE POLICY "Users can delete equipment attributes" ON public.equipment_attributes
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.equipment e
        WHERE e.id = equipment_attributes.equipment_id
          AND (
            -- Same org with proper role gives delete access
            EXISTS (
              SELECT 1 FROM public.user_profiles up
              JOIN public.user_roles ur ON ur.user_id = up.id AND ur.org_id = up.org_id
              WHERE up.id = auth.uid()
                AND up.org_id = e.org_id
                AND ur.role IN ('owner', 'manager')
            )
            OR
            -- Team membership with proper role gives delete access
            EXISTS (
              SELECT 1 FROM public.team t
              JOIN public.team_member tm ON tm.team_id = t.id
              JOIN public.team_roles tr ON tr.team_member_id = tm.id
              JOIN public.app_user au ON tm.user_id = au.id
              WHERE t.id = e.team_id
                AND au.auth_uid = auth.uid()
                AND tr.role IN ('manager', 'owner', 'creator')
            )
          )
      )
    );

-- Ensure app_user.auth_uid is the right type
-- This is safe to run repeatedly
ALTER TABLE IF EXISTS public.app_user 
  ALTER COLUMN auth_uid TYPE uuid USING auth_uid::uuid;
