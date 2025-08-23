
-- 1) Customers table (additive, idempotent)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON public.customers(organization_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_admins_select'
  ) THEN
    CREATE POLICY customers_admins_select
      ON public.customers
      FOR SELECT
      USING (is_org_admin(auth.uid(), organization_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_admins_insert'
  ) THEN
    CREATE POLICY customers_admins_insert
      ON public.customers
      FOR INSERT
      WITH CHECK (is_org_admin(auth.uid(), organization_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_admins_update'
  ) THEN
    CREATE POLICY customers_admins_update
      ON public.customers
      FOR UPDATE
      USING (is_org_admin(auth.uid(), organization_id));
  END IF;
END$$;


-- 2) Customer Contacts (using profiles.id instead of auth.users for safety)
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, user_id)
);

-- Ensure role values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customer_contacts_role_check'
      AND conrelid = 'public.customer_contacts'::regclass
  ) THEN
    ALTER TABLE public.customer_contacts
      ADD CONSTRAINT customer_contacts_role_check
      CHECK (role IN ('customer_viewer','customer_requestor','customer_manager'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON public.customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_user_id ON public.customer_contacts(user_id);

ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

-- Admins-only (via customer -> organization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customer_contacts' AND policyname = 'customer_contacts_admins_select'
  ) THEN
    CREATE POLICY customer_contacts_admins_select
      ON public.customer_contacts
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = customer_contacts.customer_id
            AND is_org_admin(auth.uid(), c.organization_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customer_contacts' AND policyname = 'customer_contacts_admins_insert'
  ) THEN
    CREATE POLICY customer_contacts_admins_insert
      ON public.customer_contacts
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = customer_contacts.customer_id
            AND is_org_admin(auth.uid(), c.organization_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customer_contacts' AND policyname = 'customer_contacts_admins_update'
  ) THEN
    CREATE POLICY customer_contacts_admins_update
      ON public.customer_contacts
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = customer_contacts.customer_id
            AND is_org_admin(auth.uid(), c.organization_id)
        )
      );
  END IF;
END$$;


-- 3) Customer Sites (scaffold)
CREATE TABLE IF NOT EXISTS public.customer_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name text,
  address jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_sites_customer_id ON public.customer_sites(customer_id);

ALTER TABLE public.customer_sites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customer_sites' AND policyname = 'customer_sites_admins_select'
  ) THEN
    CREATE POLICY customer_sites_admins_select
      ON public.customer_sites
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = customer_sites.customer_id
            AND is_org_admin(auth.uid(), c.organization_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customer_sites' AND policyname = 'customer_sites_admins_insert'
  ) THEN
    CREATE POLICY customer_sites_admins_insert
      ON public.customer_sites
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = customer_sites.customer_id
            AND is_org_admin(auth.uid(), c.organization_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customer_sites' AND policyname = 'customer_sites_admins_update'
  ) THEN
    CREATE POLICY customer_sites_admins_update
      ON public.customer_sites
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = customer_sites.customer_id
            AND is_org_admin(auth.uid(), c.organization_id)
        )
      );
  END IF;
END$$;


-- 4) Equipment: nullable customer_id (additive)
ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_customer_id ON public.equipment(customer_id);


-- 5) Organizations: feature toggle
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS customers_feature_enabled boolean DEFAULT false;


-- 6) Intentionally disabled (for future PR) — example policies to allow customer contacts limited read access.
--    These are provided here as comments to avoid enabling any new access today.
--    When we enable Customers portal later, we can uncomment and adapt carefully.
--
-- -- Example: Allow customer contacts to read equipment tied to their customer (READ ONLY).
-- -- CREATE POLICY equipment_customer_contacts_read
-- --   ON public.equipment
-- --   FOR SELECT
-- --   USING (
-- --     EXISTS (
-- --       SELECT 1
-- --       FROM public.customer_contacts cc
-- --       JOIN public.customers c ON c.id = cc.customer_id
-- --       WHERE equipment.customer_id = c.id
-- --         AND cc.user_id = auth.uid()
-- --     )
-- --   );
--
-- -- Similar for work_orders when we define the linkage and scoped fields.
