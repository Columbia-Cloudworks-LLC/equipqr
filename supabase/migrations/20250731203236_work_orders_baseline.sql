-- Create enum types for work orders if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_order_status') THEN
    CREATE TYPE public.work_order_status AS ENUM (
      'submitted', 'accepted', 'in_progress', 'on_hold', 'completed', 'cancelled'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_order_priority') THEN
    CREATE TYPE public.work_order_priority AS ENUM (
      'low', 'medium', 'high', 'critical'
    );
  END IF;
END$$;

-- Baseline definition of work_orders table including team and historical fields
CREATE TABLE IF NOT EXISTS public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status public.work_order_status NOT NULL DEFAULT 'submitted',
  priority public.work_order_priority NOT NULL DEFAULT 'medium',
  created_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  completed_date timestamptz,
  acceptance_date timestamptz,
  has_pm boolean NOT NULL DEFAULT false,
  pm_required boolean NOT NULL DEFAULT false,
  is_historical boolean NOT NULL DEFAULT false,
  historical_start_date timestamptz,
  historical_notes text,
  created_by_admin uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  assignee_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful index for historical queries
CREATE INDEX IF NOT EXISTS idx_work_orders_historical ON public.work_orders(is_historical, organization_id);

-- Enable row level security
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Standard RLS policies for organization members
CREATE POLICY work_orders_select_organization_members
  ON public.work_orders
  FOR SELECT
  USING (check_org_access_secure(auth.uid(), organization_id));

CREATE POLICY work_orders_insert_organization_members
  ON public.work_orders
  FOR INSERT
  WITH CHECK (
    check_org_access_secure(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

CREATE POLICY work_orders_update_organization_members
  ON public.work_orders
  FOR UPDATE
  USING (
    check_org_access_secure(auth.uid(), organization_id) AND (
      check_org_admin_secure(auth.uid(), organization_id)
      OR assignee_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = work_orders.team_id
          AND tm.user_id = auth.uid()
          AND tm.role = 'manager'
      )
    )
  );

CREATE POLICY work_orders_delete_admins
  ON public.work_orders
  FOR DELETE
  USING (check_org_admin_secure(auth.uid(), organization_id));

-- Additional policies for historical work orders
CREATE POLICY "Admins can create historical work orders"
  ON public.work_orders
  FOR INSERT
  WITH CHECK (
    is_historical = true
    AND is_org_admin(auth.uid(), organization_id)
    AND created_by_admin = auth.uid()
  );

CREATE POLICY "Admins can update historical work orders"
  ON public.work_orders
  FOR UPDATE
  USING (
    is_historical = true
    AND is_org_admin(auth.uid(), organization_id)
  );

-- Updated_at trigger
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION public.touch_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $func$;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_work_orders_touch'
  ) THEN
    CREATE TRIGGER trg_work_orders_touch
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END$$;
