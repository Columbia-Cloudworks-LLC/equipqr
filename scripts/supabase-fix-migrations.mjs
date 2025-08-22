#!/usr/bin/env node

import { readdir, readFile, writeFile, rename } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const TIMESTAMP_PATTERN = /^\d{14}_[a-f0-9-]+\.sql$/;
const STANDARD_PATTERN = /^\d{14}_[A-Za-z0-9._-]+\.sql$/;
const DASH_AFTER_TS = /^(\d{14})-(.*\.sql)$/;
const TS_NOOP_DASH = /^(\d{14})-\.sql$/;
const NO_OP_COMMENT = '-- no-op migration (empty file normalized)';
const DASH_NO_OP_COMMENT = '-- no-op migration (dash file normalized)';
const BASELINE_TS = '20250730000100';
const BASELINE_FILE = `${BASELINE_TS}_work_orders_baseline.sql`;

const generateBaselineSQL = () => `
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
  -- Create the function if needed (idempotent safety)
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
END$$;`;


async function fixMigrations() {
  console.log('🔍 Scanning Supabase migrations...');
  
  try {
    const files = await readdir(migrationsDir);
    let sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    console.log(`Found ${sqlFiles.length} SQL migration files`);
    
    let fixedCount = 0;
    let renamedCount = 0;
    const warnings = [];
    
    // Pass 1: rename invalid filenames
    for (const file of sqlFiles) {
      const oldPath = join(migrationsDir, file);

      // Handle dash-only names
      if (file === '-.sql' || file.startsWith('-.') || file === '-') {
        const newName = `${BASELINE_TS}_noop.sql`;
        const newPath = join(migrationsDir, newName);
        console.log(`📝 Renaming dash-only migration: ${file} -> ${newName}`);
        await rename(oldPath, newPath);
        await writeFile(newPath, DASH_NO_OP_COMMENT + '\n');
        renamedCount++; fixedCount++;
        continue;
      }

      // Handle timestamp-dash-noop (e.g., 20250812213628-.sql)
      const noopMatch = file.match(TS_NOOP_DASH);
      if (noopMatch) {
        const newName = `${noopMatch[1]}_noop.sql`;
        const newPath = join(migrationsDir, newName);
        console.log(`📝 Renaming invalid noop migration: ${file} -> ${newName}`);
        await rename(oldPath, newPath);
        await writeFile(newPath, NO_OP_COMMENT + '\n');
        renamedCount++; fixedCount++;
        continue;
      }

      // Replace dash after timestamp with underscore (e.g., 20250724021454-abc.sql -> 20250724021454_abc.sql)
      const dashAfterTs = file.match(DASH_AFTER_TS);
      if (dashAfterTs) {
        const newName = `${dashAfterTs[1]}_${dashAfterTs[2]}`;
        const newPath = join(migrationsDir, newName);
        console.log(`📝 Normalizing filename: ${file} -> ${newName}`);
        await rename(oldPath, newPath);
        renamedCount++;
        continue;
      }

      // Optional warnings for non-standard names
      if (!STANDARD_PATTERN.test(file)) {
        warnings.push(`⚠️  Non-standard filename format: ${file}`);
      }
    }

    // Re-scan after renames
    sqlFiles = (await readdir(migrationsDir)).filter(file => file.endsWith('.sql')).sort();

    // Pass 2: ensure early baseline for work_orders exists
    let hasWorkOrdersCreate = false;
    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      const content = await readFile(filePath, 'utf8');
      if (/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?public\.work_orders/i.test(content)) {
        hasWorkOrdersCreate = true;
        break;
      }
    }

    if (!hasWorkOrdersCreate) {
      const baselinePath = join(migrationsDir, BASELINE_FILE);
      console.log(`🧱 Creating baseline migration: ${BASELINE_FILE}`);
      await writeFile(baselinePath, generateBaselineSQL() + '\n');
      fixedCount++;
    }

    // Pass 3: normalize empty files to no-op comment
    for (const file of sqlFiles) {
      const fp = join(migrationsDir, file);
      const content = (await readFile(fp, 'utf8')).trim();
      if (content.length === 0) {
        console.log(`📝 Normalizing empty migration: ${file}`);
        await writeFile(fp, NO_OP_COMMENT + '\n');
        fixedCount++;
      }
    }
    
    console.log(`✅ Fix complete. Renamed: ${renamedCount}, Modified: ${fixedCount}`);
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(warning));
    }
    console.log('\nNext steps: run "supabase db reset" again.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error scanning migrations:', error.message);
    process.exit(1);
  }
}

fixMigrations();