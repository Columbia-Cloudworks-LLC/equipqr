
-- 1) Create missing enum types if not present
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

-- 2) Create the work_orders table (minimal baseline; no foreign keys here)
CREATE TABLE IF NOT EXISTS public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  equipment_id uuid,
  team_id uuid,
  created_by uuid NOT NULL,
  assignee_id uuid,
  title text NOT NULL,
  description text,
  status public.work_order_status NOT NULL DEFAULT 'submitted',
  priority public.work_order_priority NOT NULL DEFAULT 'medium',
  created_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  completed_date timestamptz,
  created_by_name text,
  assignee_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Ensure RLS is enabled (required by subsequent policy migrations)
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- 4) Ensure a simple updated_at trigger exists for work_orders
DO $$
BEGIN
  -- Create the function if needed (idempotent safety); your project already defines this,
  -- but this CREATE OR REPLACE is harmless and keeps the migration robust.
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

  -- Create the trigger if not present
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_work_orders_touch'
  ) THEN
    CREATE TRIGGER trg_work_orders_touch
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END$$;
