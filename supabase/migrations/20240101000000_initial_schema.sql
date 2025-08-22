-- Baseline schema for existing production tables
-- Generated from production schema export

-- Enum types
CREATE TYPE IF NOT EXISTS public.equipment_status AS ENUM ('active','maintenance','inactive');
CREATE TYPE IF NOT EXISTS public.organization_plan AS ENUM ('free','premium');
CREATE TYPE IF NOT EXISTS public.team_member_role AS ENUM ('owner','manager','technician','requestor','viewer');
CREATE TYPE IF NOT EXISTS public.work_order_priority AS ENUM ('low','medium','high');
CREATE TYPE IF NOT EXISTS public.work_order_status AS ENUM ('submitted','accepted','assigned','in_progress','on_hold','completed','cancelled');

-- Tables
CREATE TABLE IF NOT EXISTS billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_type text NOT NULL,
  user_id uuid,
  event_data jsonb DEFAULT '{}'::jsonb,
  amount_change numeric(10,2) DEFAULT 0,
  effective_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS billing_exemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  exemption_type text NOT NULL DEFAULT 'user_licenses',
  exemption_value integer NOT NULL DEFAULT 0,
  reason text,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS billing_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  usage_type text NOT NULL,
  usage_value integer NOT NULL,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS equipment (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  manufacturer text NOT NULL,
  model text NOT NULL,
  serial_number text NOT NULL,
  status equipment_status NOT NULL DEFAULT 'active',
  location text NOT NULL,
  installation_date date NOT NULL,
  warranty_expiration date,
  last_maintenance date,
  notes text,
  image_url text,
  custom_attributes jsonb DEFAULT '{}'::jsonb,
  last_known_location jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  team_id uuid,
  working_hours numeric DEFAULT 0,
  default_pm_template_id uuid,
  import_id text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS equipment_note_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_note_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  description text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by_name text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS equipment_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  hours_worked numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_modified_by uuid,
  last_modified_at timestamptz DEFAULT now(),
  author_name text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS equipment_working_hours_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL,
  old_hours numeric,
  new_hours numeric NOT NULL,
  hours_added numeric,
  updated_by uuid NOT NULL,
  updated_by_name text,
  update_source text NOT NULL DEFAULT 'manual',
  work_order_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS invitation_performance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  execution_time_ms numeric NOT NULL,
  success boolean NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS member_removal_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  removed_user_id uuid NOT NULL,
  removed_user_name text NOT NULL,
  removed_user_role text NOT NULL,
  removed_by uuid NOT NULL,
  teams_transferred integer DEFAULT 0,
  new_manager_id uuid,
  removal_reason text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  equipment_id uuid NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_invitations boolean DEFAULT true,
  email_work_orders boolean DEFAULT true,
  email_equipment_alerts boolean DEFAULT true,
  email_billing boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  invitation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  accepted_by uuid,
  slot_reserved boolean DEFAULT false,
  slot_purchase_id uuid,
  declined_at timestamptz,
  expired_at timestamptz,
  offers_account_creation boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_date timestamptz NOT NULL DEFAULT now(),
  slot_purchase_id uuid,
  activated_slot_at timestamptz,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS organization_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  slot_type text NOT NULL DEFAULT 'user_license',
  purchased_slots integer NOT NULL DEFAULT 0,
  used_slots integer NOT NULL DEFAULT 0,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  stripe_payment_intent_id text,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  stripe_subscription_id text,
  stripe_price_id text,
  auto_renew boolean DEFAULT true,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  feature_type text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price_cents integer NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  plan organization_plan NOT NULL DEFAULT 'free',
  member_count integer NOT NULL DEFAULT 1,
  max_members integer NOT NULL DEFAULT 5,
  features text[] NOT NULL DEFAULT ARRAY['Equipment Management','Work Orders','Team Management'],
  billing_cycle text,
  next_billing_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  billable_members integer DEFAULT 0,
  storage_used_mb integer DEFAULT 0,
  fleet_map_enabled boolean DEFAULT false,
  last_billing_calculation timestamptz DEFAULT now(),
  logo text,
  background_color text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS pm_checklist_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  name text NOT NULL,
  description text,
  is_protected boolean NOT NULL DEFAULT false,
  template_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS pm_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pm_id uuid NOT NULL,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS preventative_maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL,
  equipment_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completed_by uuid,
  status text NOT NULL DEFAULT 'pending',
  checklist_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  is_historical boolean NOT NULL DEFAULT false,
  historical_completion_date timestamptz,
  historical_notes text,
  template_id uuid,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid NOT NULL,
  email text,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email_private boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS scans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  equipment_id uuid NOT NULL,
  scanned_by uuid NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  location text,
  notes text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS slot_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  purchased_by uuid NOT NULL,
  slot_type text NOT NULL DEFAULT 'user_license',
  quantity integer NOT NULL,
  unit_price_cents integer NOT NULL DEFAULT 1000,
  total_amount_cents integer NOT NULL,
  stripe_payment_intent_id text,
  stripe_session_id text,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS stripe_event_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  type text NOT NULL,
  subscription_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  stripe_customer_id text,
  subscribed boolean NOT NULL DEFAULT false,
  subscription_tier text,
  subscription_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role team_member_role NOT NULL DEFAULT 'technician',
  joined_date timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS user_license_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  stripe_subscription_id text NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_price_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id)
);

CREATE TABLE IF NOT EXISTS work_order_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL DEFAULT 0,
  total_price_cents integer,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS work_order_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  note_id uuid,
  uploaded_by_name text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS work_order_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  hours_worked numeric(5,2) DEFAULT 0,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  author_name text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS work_order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL,
  old_status work_order_status,
  new_status work_order_status NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_historical_creation boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS work_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  equipment_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority work_order_priority NOT NULL DEFAULT 'medium',
  status work_order_status NOT NULL DEFAULT 'submitted',
  assignee_id uuid,
  created_by uuid NOT NULL,
  created_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  estimated_hours integer,
  completed_date timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  acceptance_date timestamptz,
  has_pm boolean NOT NULL DEFAULT false,
  pm_required boolean NOT NULL DEFAULT false,
  created_by_name text,
  assignee_name text,
  is_historical boolean NOT NULL DEFAULT false,
  historical_start_date timestamptz,
  historical_notes text,
  created_by_admin uuid,
  PRIMARY KEY (id)
);

-- Foreign key constraints
ALTER TABLE public.billing_events ADD CONSTRAINT billing_events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.billing_exemptions ADD CONSTRAINT billing_exemptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.billing_usage ADD CONSTRAINT billing_usage_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_default_pm_template_id_fkey FOREIGN KEY (default_pm_template_id) REFERENCES public.pm_checklist_templates (id) ON DELETE SET NULL;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams (id);
ALTER TABLE public.equipment_note_images ADD CONSTRAINT equipment_note_images_equipment_note_id_fkey FOREIGN KEY (equipment_note_id) REFERENCES public.equipment_notes (id) ON DELETE CASCADE;
ALTER TABLE public.equipment_note_images ADD CONSTRAINT equipment_note_images_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.equipment_notes ADD CONSTRAINT equipment_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.equipment_notes ADD CONSTRAINT equipment_notes_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment (id) ON DELETE CASCADE;
ALTER TABLE public.equipment_notes ADD CONSTRAINT equipment_notes_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE public.notes ADD CONSTRAINT notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles (id);
ALTER TABLE public.notes ADD CONSTRAINT notes_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment (id) ON DELETE CASCADE;
ALTER TABLE public.organization_invitations ADD CONSTRAINT organization_invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.profiles (id) ON DELETE SET NULL;
ALTER TABLE public.organization_invitations ADD CONSTRAINT organization_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.organization_invitations ADD CONSTRAINT organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.organization_invitations ADD CONSTRAINT organization_invitations_slot_purchase_id_fkey FOREIGN KEY (slot_purchase_id) REFERENCES public.slot_purchases (id);
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_slot_purchase_id_fkey FOREIGN KEY (slot_purchase_id) REFERENCES public.slot_purchases (id);
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.organization_slots ADD CONSTRAINT organization_slots_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.organization_subscriptions ADD CONSTRAINT organization_subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.pm_checklist_templates ADD CONSTRAINT pm_checklist_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE RESTRICT;
ALTER TABLE public.pm_checklist_templates ADD CONSTRAINT pm_checklist_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.pm_checklist_templates ADD CONSTRAINT pm_checklist_templates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles (id) ON DELETE RESTRICT;
ALTER TABLE public.pm_status_history ADD CONSTRAINT pm_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles (id);
ALTER TABLE public.pm_status_history ADD CONSTRAINT pm_status_history_pm_id_fkey FOREIGN KEY (pm_id) REFERENCES public.preventative_maintenance (id) ON DELETE CASCADE;
ALTER TABLE public.preventative_maintenance ADD CONSTRAINT fk_pm_equipment FOREIGN KEY (equipment_id) REFERENCES public.equipment (id) ON DELETE CASCADE;
ALTER TABLE public.preventative_maintenance ADD CONSTRAINT fk_pm_organization FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.preventative_maintenance ADD CONSTRAINT fk_pm_work_order FOREIGN KEY (work_order_id) REFERENCES public.work_orders (id) ON DELETE CASCADE;
ALTER TABLE public.preventative_maintenance ADD CONSTRAINT preventative_maintenance_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.pm_checklist_templates (id) ON DELETE SET NULL;
ALTER TABLE public.scans ADD CONSTRAINT scans_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment (id) ON DELETE CASCADE;
ALTER TABLE public.scans ADD CONSTRAINT scans_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.profiles (id);
ALTER TABLE public.slot_purchases ADD CONSTRAINT slot_purchases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.slot_purchases ADD CONSTRAINT slot_purchases_purchased_by_fkey FOREIGN KEY (purchased_by) REFERENCES public.profiles (id);
ALTER TABLE public.team_members ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams (id) ON DELETE CASCADE;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.teams ADD CONSTRAINT teams_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.user_license_subscriptions ADD CONSTRAINT user_license_subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.work_order_costs ADD CONSTRAINT work_order_costs_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders (id) ON DELETE CASCADE;
ALTER TABLE public.work_order_images ADD CONSTRAINT work_order_images_note_id_fkey FOREIGN KEY (note_id) REFERENCES public.work_order_notes (id) ON DELETE CASCADE;
ALTER TABLE public.work_order_notes ADD CONSTRAINT fk_work_order_notes_author FOREIGN KEY (author_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.work_order_status_history ADD CONSTRAINT work_order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles (id);
ALTER TABLE public.work_order_status_history ADD CONSTRAINT work_order_status_history_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders (id) ON DELETE CASCADE;
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles (id);
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles (id);
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment (id) ON DELETE CASCADE;
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;
