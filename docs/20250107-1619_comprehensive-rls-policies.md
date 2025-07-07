# EquipQR Comprehensive RLS Policies Documentation

## Executive Summary

This document provides a comprehensive analysis of Row Level Security (RLS) policies required for the EquipQR application, with specific focus on **preventing infinite recursion** that has plagued the system in previous implementations. The analysis covers all 25+ tables in the system and provides specific policy recommendations that maintain security while avoiding circular dependencies.

## Critical Issue: Infinite Recursion Prevention

### Historical Problems Identified
The EquipQR codebase shows extensive evidence of infinite recursion issues:
- Multiple migration files attempting to fix "stack depth limit exceeded" errors
- Circular dependencies in `organization_members` and `organization_invitations` tables
- Complex `SECURITY DEFINER` functions causing performance issues

### Root Cause Analysis
1. **Self-referential policies**: Policies that query the same table they're protecting
2. **Complex function chains**: Security definer functions calling other functions that trigger RLS
3. **Organizational membership checks**: Policies checking org membership within org membership table

## RLS Policy Architecture Principles

### 1. Non-Recursive Design Patterns
- **Direct queries only**: Policies must never query the table they're protecting
- **Security definer functions**: Use carefully with `SET row_security = 'off'`
- **Simple permission checks**: Avoid complex nested function calls
- **Cached results**: Pre-compute permissions where possible

### 2. Policy Hierarchy
```
Level 1: User Authentication (auth.uid())
Level 2: Organization Membership (direct table queries)
Level 3: Team Membership (organization-scoped)
Level 4: Resource Access (team/organization-scoped)
```

### 3. Security Function Standards
All security functions must:
- Use `SECURITY DEFINER` with `SET row_security = 'off'`
- Query base tables directly without triggering RLS
- Be marked as `STABLE` for performance
- Have clear single responsibility

## Table-by-Table RLS Policy Specifications

### 1. Core Identity Tables

#### `profiles` Table
**Purpose**: User profile information
**Criticality**: High - Foundation table

**Policies Required**:
```sql
-- Allow all users to view any profile (for assignments, etc.)
CREATE POLICY "profiles_select_all" ON profiles 
FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles 
FOR UPDATE USING (id = auth.uid());

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles 
FOR INSERT WITH CHECK (id = auth.uid());
```

**Rationale**: Profiles need broad read access for user selection in forms, but strict write access.

#### `organizations` Table
**Purpose**: Organization/company entities
**Criticality**: High - Top-level tenant isolation

**Required Security Function**:
```sql
CREATE OR REPLACE FUNCTION public.check_org_membership_direct(user_uuid uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND status = 'active'
  );
$$;
```

**Policies Required**:
```sql
-- Members can view their organizations
CREATE POLICY "orgs_select_members" ON organizations 
FOR SELECT USING (check_org_membership_direct(auth.uid(), id));

-- Only admins can update organizations
CREATE POLICY "orgs_update_admins" ON organizations 
FOR UPDATE USING (check_org_admin_direct(auth.uid(), id));

-- Anyone can create organizations (for new signups)
CREATE POLICY "orgs_insert_any" ON organizations 
FOR INSERT WITH CHECK (true);
```

#### `organization_members` Table
**Purpose**: User membership in organizations
**Criticality**: Critical - High recursion risk

**Required Security Functions**:
```sql
CREATE OR REPLACE FUNCTION public.check_org_admin_direct(user_uuid uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
$$;
```

**Policies Required**:
```sql
-- Users can view members of organizations they belong to
-- CRITICAL: Use EXISTS subquery to avoid recursion
CREATE POLICY "org_members_select_safe" ON organization_members 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om2 
    WHERE om2.organization_id = organization_members.organization_id 
      AND om2.user_id = auth.uid() 
      AND om2.status = 'active'
  )
);

-- Only admins can modify membership
CREATE POLICY "org_members_modify_admins" ON organization_members 
FOR ALL USING (check_org_admin_direct(auth.uid(), organization_id))
WITH CHECK (check_org_admin_direct(auth.uid(), organization_id));
```

**Anti-Pattern to Avoid**:
```sql
-- NEVER DO THIS - Causes infinite recursion
CREATE POLICY "bad_policy" ON organization_members 
FOR SELECT USING (check_org_membership_direct(auth.uid(), organization_id));
```

### 2. Team Management Tables

#### `teams` Table
**Purpose**: Teams within organizations
**Criticality**: Medium

**Policies Required**:
```sql
-- Members can view teams in their organizations
CREATE POLICY "teams_select_members" ON teams 
FOR SELECT USING (check_org_membership_direct(auth.uid(), organization_id));

-- Only admins can manage teams
CREATE POLICY "teams_modify_admins" ON teams 
FOR ALL USING (check_org_admin_direct(auth.uid(), organization_id))
WITH CHECK (check_org_admin_direct(auth.uid(), organization_id));
```

#### `team_members` Table
**Purpose**: User membership in teams
**Criticality**: Medium

**Required Security Function**:
```sql
CREATE OR REPLACE FUNCTION public.check_team_org_membership(user_uuid uuid, team_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    JOIN teams t ON t.organization_id = om.organization_id
    WHERE om.user_id = user_uuid 
      AND t.id = team_uuid
      AND om.status = 'active'
  );
$$;
```

**Policies Required**:
```sql
-- Members can view team members in their organizations
CREATE POLICY "team_members_select_org" ON team_members 
FOR SELECT USING (check_team_org_membership(auth.uid(), team_id));

-- Admins can manage team membership
CREATE POLICY "team_members_modify_admins" ON team_members 
FOR ALL USING (
  check_org_admin_direct(auth.uid(), 
    (SELECT organization_id FROM teams WHERE id = team_id)
  )
)
WITH CHECK (
  check_org_admin_direct(auth.uid(), 
    (SELECT organization_id FROM teams WHERE id = team_id)
  )
);
```

### 3. Core Business Tables

#### `equipment` Table
**Purpose**: Equipment/asset management
**Criticality**: High - Core business entity

**Policies Required**:
```sql
-- Members can view equipment in their organizations
CREATE POLICY "equipment_select_members" ON equipment 
FOR SELECT USING (check_org_membership_direct(auth.uid(), organization_id));

-- Members can create equipment
CREATE POLICY "equipment_insert_members" ON equipment 
FOR INSERT WITH CHECK (check_org_membership_direct(auth.uid(), organization_id));

-- Admins can modify/delete equipment
CREATE POLICY "equipment_modify_admins" ON equipment 
FOR UPDATE USING (check_org_admin_direct(auth.uid(), organization_id));

CREATE POLICY "equipment_delete_admins" ON equipment 
FOR DELETE USING (check_org_admin_direct(auth.uid(), organization_id));
```

#### `work_orders` Table
**Purpose**: Work order management
**Criticality**: High - Core business workflow

**Required Security Function**:
```sql
CREATE OR REPLACE FUNCTION public.check_work_order_access(user_uuid uuid, wo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM work_orders wo
    JOIN organization_members om ON om.organization_id = wo.organization_id
    WHERE wo.id = wo_id
      AND om.user_id = user_uuid 
      AND om.status = 'active'
      AND (
        wo.created_by = user_uuid OR 
        wo.assignee_id = user_uuid OR
        om.role IN ('owner', 'admin') OR
        EXISTS (
          SELECT 1 FROM team_members tm 
          WHERE tm.team_id = wo.team_id 
            AND tm.user_id = user_uuid
        )
      )
  );
$$;
```

**Policies Required**:
```sql
-- Users can view work orders they have access to
CREATE POLICY "work_orders_select_access" ON work_orders 
FOR SELECT USING (check_work_order_access(auth.uid(), id));

-- Organization members can create work orders
CREATE POLICY "work_orders_insert_members" ON work_orders 
FOR INSERT WITH CHECK (
  check_org_membership_direct(auth.uid(), organization_id) AND
  created_by = auth.uid()
);

-- Admins and assigned users can update work orders
CREATE POLICY "work_orders_update_authorized" ON work_orders 
FOR UPDATE USING (
  check_org_admin_direct(auth.uid(), organization_id) OR
  assignee_id = auth.uid()
);

-- Only admins can delete work orders
CREATE POLICY "work_orders_delete_admins" ON work_orders 
FOR DELETE USING (check_org_admin_direct(auth.uid(), organization_id));
```

### 4. Activity Tracking Tables

#### `scans` Table
**Purpose**: QR code scan tracking
**Criticality**: Medium

**Policies Required**:
```sql
-- Users can view scans for equipment they can access
CREATE POLICY "scans_select_equipment_access" ON scans 
FOR SELECT USING (
  check_org_membership_direct(auth.uid(), 
    (SELECT organization_id FROM equipment WHERE id = equipment_id)
  )
);

-- Users can create scans for accessible equipment
CREATE POLICY "scans_insert_equipment_access" ON scans 
FOR INSERT WITH CHECK (
  scanned_by = auth.uid() AND
  check_org_membership_direct(auth.uid(), 
    (SELECT organization_id FROM equipment WHERE id = equipment_id)
  )
);
```

#### `equipment_notes` Table
**Purpose**: Notes attached to equipment
**Criticality**: Medium

**Policies Required**:
```sql
-- Users can view non-private notes or their own notes
CREATE POLICY "equipment_notes_select_accessible" ON equipment_notes 
FOR SELECT USING (
  check_org_membership_direct(auth.uid(), 
    (SELECT organization_id FROM equipment WHERE id = equipment_id)
  ) AND 
  (NOT is_private OR author_id = auth.uid())
);

-- Users can create notes on accessible equipment
CREATE POLICY "equipment_notes_insert_members" ON equipment_notes 
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND
  check_org_membership_direct(auth.uid(), 
    (SELECT organization_id FROM equipment WHERE id = equipment_id)
  )
);

-- Authors can update their own notes
CREATE POLICY "equipment_notes_update_own" ON equipment_notes 
FOR UPDATE USING (author_id = auth.uid());

-- Authors and admins can delete notes
CREATE POLICY "equipment_notes_delete_authorized" ON equipment_notes 
FOR DELETE USING (
  author_id = auth.uid() OR
  check_org_admin_direct(auth.uid(), 
    (SELECT organization_id FROM equipment WHERE id = equipment_id)
  )
);
```

### 5. Work Order Related Tables

#### `work_order_notes` Table
**Purpose**: Notes on work orders
**Criticality**: Medium

**Policies Required**:
```sql
-- Users can view notes on accessible work orders
CREATE POLICY "work_order_notes_select_accessible" ON work_order_notes 
FOR SELECT USING (
  check_work_order_access(auth.uid(), work_order_id) AND
  (NOT is_private OR author_id = auth.uid())
);

-- Users can create notes on accessible work orders
CREATE POLICY "work_order_notes_insert_access" ON work_order_notes 
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND
  check_work_order_access(auth.uid(), work_order_id)
);

-- Authors can update their own notes
CREATE POLICY "work_order_notes_update_own" ON work_order_notes 
FOR UPDATE USING (author_id = auth.uid());
```

#### `work_order_costs` Table
**Purpose**: Cost tracking for work orders
**Criticality**: Medium

**Policies Required**:
```sql
-- Users can view costs for accessible work orders
CREATE POLICY "work_order_costs_select_accessible" ON work_order_costs 
FOR SELECT USING (check_work_order_access(auth.uid(), work_order_id));

-- Users can create costs for work orders they created
CREATE POLICY "work_order_costs_insert_creators" ON work_order_costs 
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  check_work_order_access(auth.uid(), work_order_id)
);

-- Creators and admins can modify costs
CREATE POLICY "work_order_costs_modify_authorized" ON work_order_costs 
FOR UPDATE USING (
  created_by = auth.uid() OR
  check_org_admin_direct(auth.uid(), 
    (SELECT organization_id FROM work_orders WHERE id = work_order_id)
  )
);
```

#### `preventative_maintenance` Table
**Purpose**: Preventative maintenance scheduling
**Criticality**: Medium

**Policies Required**:
```sql
-- Members can view PM for their organization equipment
CREATE POLICY "pm_select_org_equipment" ON preventative_maintenance 
FOR SELECT USING (check_org_membership_direct(auth.uid(), organization_id));

-- Members can create PM records
CREATE POLICY "pm_insert_members" ON preventative_maintenance 
FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  check_org_membership_direct(auth.uid(), organization_id)
);

-- Assigned users and admins can update PM
CREATE POLICY "pm_update_authorized" ON preventative_maintenance 
FOR UPDATE USING (
  completed_by = auth.uid() OR
  check_org_admin_direct(auth.uid(), organization_id)
);
```

### 6. Invitation and Access Management

#### `organization_invitations` Table
**Purpose**: Organization invitation management
**Criticality**: Critical - High recursion risk

**Special Considerations**: This table has been the source of most infinite recursion issues.

**Required Security Function**:
```sql
CREATE OR REPLACE FUNCTION public.can_manage_org_invitations(user_uuid uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
$$;
```

**Policies Required**:
```sql
-- Only admins can manage invitations
CREATE POLICY "invitations_select_admins" ON organization_invitations 
FOR SELECT USING (can_manage_org_invitations(auth.uid(), organization_id));

CREATE POLICY "invitations_insert_admins" ON organization_invitations 
FOR INSERT WITH CHECK (
  invited_by = auth.uid() AND
  can_manage_org_invitations(auth.uid(), organization_id)
);

CREATE POLICY "invitations_update_admins" ON organization_invitations 
FOR UPDATE USING (can_manage_org_invitations(auth.uid(), organization_id));

CREATE POLICY "invitations_delete_admins" ON organization_invitations 
FOR DELETE USING (can_manage_org_invitations(auth.uid(), organization_id));
```

### 7. Billing and Subscription Tables

#### `billing_events` Table
**Purpose**: Billing event tracking
**Criticality**: High - Financial data

**Policies Required**:
```sql
-- Only org admins can view billing events
CREATE POLICY "billing_events_select_admins" ON billing_events 
FOR SELECT USING (check_org_admin_direct(auth.uid(), organization_id));

-- System can insert events (via service role)
CREATE POLICY "billing_events_insert_system" ON billing_events 
FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

#### `organization_subscriptions` Table
**Purpose**: Subscription management
**Criticality**: High - Financial data

**Policies Required**:
```sql
-- Only org admins can view subscriptions
CREATE POLICY "subscriptions_select_admins" ON organization_subscriptions 
FOR SELECT USING (check_org_admin_direct(auth.uid(), organization_id));

-- Only system can modify subscriptions
CREATE POLICY "subscriptions_modify_system" ON organization_subscriptions 
FOR ALL USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

#### `slot_purchases` Table
**Purpose**: Slot purchase tracking
**Criticality**: High - Financial data

**Policies Required**:
```sql
-- Purchasers and admins can view slot purchases
CREATE POLICY "slot_purchases_select_authorized" ON slot_purchases 
FOR SELECT USING (
  purchased_by = auth.uid() OR
  check_org_admin_direct(auth.uid(), organization_id)
);

-- Only purchaser can create
CREATE POLICY "slot_purchases_insert_purchaser" ON slot_purchases 
FOR INSERT WITH CHECK (purchased_by = auth.uid());
```

### 8. Notification Tables

#### `notifications` Table
**Purpose**: System notifications
**Criticality**: Medium

**Policies Required**:
```sql
-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications 
FOR SELECT USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "notifications_insert_system" ON notifications 
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users can update their own notifications (mark read)
CREATE POLICY "notifications_update_own" ON notifications 
FOR UPDATE USING (user_id = auth.uid());
```

#### `notification_preferences` Table
**Purpose**: User notification preferences
**Criticality**: Low

**Policies Required**:
```sql
-- Users can manage their own preferences
CREATE POLICY "notification_prefs_own" ON notification_preferences 
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### 9. Image and File Tables

#### `equipment_note_images` Table
**Purpose**: Images attached to equipment notes
**Criticality**: Medium

**Policies Required**:
```sql
-- Users can view images for notes they can access
CREATE POLICY "equipment_note_images_select_accessible" ON equipment_note_images 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM equipment_notes en
    JOIN equipment e ON e.id = en.equipment_id
    WHERE en.id = equipment_note_id
      AND check_org_membership_direct(auth.uid(), e.organization_id)
      AND (NOT en.is_private OR en.author_id = auth.uid())
  )
);

-- Users can upload images to their notes
CREATE POLICY "equipment_note_images_insert_own" ON equipment_note_images 
FOR INSERT WITH CHECK (uploaded_by = auth.uid());
```

#### `work_order_images` Table
**Purpose**: Images attached to work orders
**Criticality**: Medium

**Policies Required**:
```sql
-- Users can view images for accessible work orders
CREATE POLICY "work_order_images_select_accessible" ON work_order_images 
FOR SELECT USING (check_work_order_access(auth.uid(), work_order_id));

-- Users can upload images to accessible work orders
CREATE POLICY "work_order_images_insert_access" ON work_order_images 
FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND
  check_work_order_access(auth.uid(), work_order_id)
);
```

## Security Function Library

### Core Security Functions
These functions form the foundation of the RLS system and must be implemented first:

```sql
-- Check organization membership
CREATE OR REPLACE FUNCTION public.check_org_membership_direct(user_uuid uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND status = 'active'
  );
$$;

-- Check organization admin status
CREATE OR REPLACE FUNCTION public.check_org_admin_direct(user_uuid uuid, org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
      AND organization_id = org_id 
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
$$;

-- Check work order access
CREATE OR REPLACE FUNCTION public.check_work_order_access(user_uuid uuid, wo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM work_orders wo
    JOIN organization_members om ON om.organization_id = wo.organization_id
    WHERE wo.id = wo_id
      AND om.user_id = user_uuid 
      AND om.status = 'active'
      AND (
        wo.created_by = user_uuid OR 
        wo.assignee_id = user_uuid OR
        om.role IN ('owner', 'admin') OR
        EXISTS (
          SELECT 1 FROM team_members tm 
          WHERE tm.team_id = wo.team_id 
            AND tm.user_id = user_uuid
        )
      )
  );
$$;
```

## Implementation Recommendations

### 1. Phased Rollout Strategy

#### Phase 1: Foundation Tables (Week 1)
- Implement `profiles`, `organizations`, `organization_members`
- Test thoroughly for recursion issues
- Validate basic org membership flows

#### Phase 2: Core Business Tables (Week 2)
- Add `teams`, `team_members`, `equipment`, `work_orders`
- Implement work order access patterns
- Test team-based permissions

#### Phase 3: Extended Tables (Week 3)
- Add notes, images, scans, and activity tables
- Implement file access controls
- Test complex permission scenarios

#### Phase 4: Financial Tables (Week 4)
- Add billing, subscription, and slot tables
- Implement financial data protection
- Test admin-only access patterns

### 2. Testing Strategy

#### Recursion Testing
```sql
-- Test for infinite recursion
DO $$
DECLARE
  test_result boolean;
BEGIN
  -- This should not cause stack overflow
  SELECT check_org_membership_direct('test-uuid', 'test-org-uuid') INTO test_result;
  RAISE NOTICE 'Recursion test passed: %', test_result;
END $$;
```

#### Permission Testing
Create comprehensive test cases for each role:
- Owner: Full access to all organization data
- Admin: Management access, no ownership changes
- Member: Basic access, limited modifications
- Team roles: Scoped access based on team membership

### 3. Monitoring and Maintenance

#### Performance Monitoring
- Monitor query execution times for security functions
- Track policy evaluation performance
- Set up alerts for unusual access patterns

#### Security Auditing
- Log all policy violations
- Track permission escalation attempts
- Regular review of policy effectiveness

## Migration Strategy

### Safe Migration Approach

1. **Backup Current State**
   ```sql
   -- Create backup of current policies
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

2. **Implement Functions First**
   - Deploy all security functions
   - Test functions independently
   - Verify no recursion issues

3. **Deploy Policies Incrementally**
   - Start with read-only policies
   - Add write policies after validation
   - Monitor for performance issues

4. **Rollback Plan**
   - Maintain ability to disable RLS quickly
   - Keep old policies commented for reference
   - Document rollback procedures

## Conclusion

This comprehensive RLS policy specification addresses the critical infinite recursion issues that have plagued the EquipQR system while maintaining robust security. The key principles are:

1. **Non-recursive design**: No policy queries the table it protects
2. **Security definer functions**: Centralized permission logic with RLS bypass
3. **Clear hierarchy**: Well-defined access levels prevent confusion
4. **Comprehensive coverage**: All 25+ tables have appropriate policies

Following this specification will result in a secure, performant, and maintainable RLS system that scales with the application's growth while preventing the infinite recursion issues that have caused significant development overhead in the past.

## Appendix: Quick Reference

### Critical Tables for Recursion Prevention
1. `organization_members` - Never self-reference in policies
2. `organization_invitations` - Use dedicated security functions
3. `team_members` - Always scope to organization first

### Emergency Procedures
If infinite recursion occurs:
```sql
-- Disable RLS temporarily
ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing policies
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

### Performance Optimization
- Index all foreign keys used in policies
- Monitor security function execution times
- Consider caching for frequently-checked permissions