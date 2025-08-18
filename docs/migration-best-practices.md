# Migration Best Practices

## Overview

This guide outlines best practices for creating and managing database migrations in EquipQR to ensure reliable CI/CD execution and prevent migration failures.

## Migration Filename Requirements

### Pattern
All migration files must follow this exact pattern:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

### Rules
- **Must start with 14 digits**: Timestamp in format `YYYYMMDDHHMMSS`
- **Must have underscore**: After timestamp to separate from description
- **Description rules**: 
  - Must start with lowercase letter or number
  - Can contain lowercase letters, numbers, underscores, hyphens
  - No spaces or special characters
- **Must end with `.sql`**

### Valid Examples
```
20250818123456_add_user_preferences.sql
20250818143022_create_work_orders_table.sql
20250818154533_add_historical_columns.sql
```

### Invalid Examples
```
20250617044539-2992e2db-7369-4358-aa76-091a8ff84d77.sql  ❌ Hyphens in timestamp
20250617145654-ec776169-7a80-4da6-89cc-27f75e58aa51.sql  ❌ Hyphens in timestamp
20250813060907-.sql                                      ❌ Missing description
```

## Safe Migration Practices

### 1. Guard Against Missing Tables
Always use conditional statements when altering existing tables:

```sql
-- ✅ Safe: Only runs if table exists
ALTER TABLE IF EXISTS public.work_orders 
ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT false;

-- ❌ Unsafe: Fails if table doesn't exist
ALTER TABLE work_orders 
ADD COLUMN is_historical BOOLEAN NOT NULL DEFAULT false;
```

### 2. Avoid Foreign Keys to Auth Schema
Never reference `auth.users` directly. Use `public.profiles` instead:

```sql
-- ❌ Avoid: Direct reference to auth.users
created_by_admin UUID REFERENCES auth.users(id)

-- ✅ Preferred: Reference profiles table or use plain UUID
created_by_admin UUID REFERENCES public.profiles(id)
-- OR
created_by_admin UUID  -- Plain UUID, no FK constraint
```

### 3. Make Migrations Idempotent
Use `IF NOT EXISTS` and `IF EXISTS` to make migrations safe to run multiple times:

```sql
-- Create table safely
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
);

-- Add columns safely
ALTER TABLE IF EXISTS public.work_orders 
ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS historical_notes TEXT;

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_work_orders_status 
ON public.work_orders(status);
```

### 4. Handle Missing Dependencies
When adding features that depend on existing tables, check for their existence:

```sql
-- Example: Adding historical work order support
DO $$ 
BEGIN
  -- Only proceed if work_orders table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'work_orders') THEN
    
    -- Add historical columns
    ALTER TABLE public.work_orders 
    ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS historical_start_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS historical_notes TEXT,
    ADD COLUMN IF NOT EXISTS created_by_admin UUID;
    
    -- Add constraint if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'profiles') THEN
      
      ALTER TABLE public.work_orders 
      ADD CONSTRAINT IF NOT EXISTS work_orders_created_by_admin_fkey 
      FOREIGN KEY (created_by_admin) REFERENCES public.profiles(id);
      
    END IF;
    
  END IF;
END $$;
```

## CI Integration

### Automatic Filename Validation
The CI pipeline includes automatic validation of migration filenames:

```bash
# Runs before tests in scripts/test-ci.mjs
node scripts/check-migration-filenames.mjs
```

### What Gets Checked
- All `.sql` files in `supabase/migrations/`
- Filename pattern compliance
- Descriptive naming conventions

### When Validation Fails
- CI build stops immediately
- Clear error messages show which files are invalid
- Examples and rules are displayed for easy fixing

## Troubleshooting Common Issues

### "relation does not exist" Errors
**Cause**: Migration tries to alter a table that hasn't been created yet

**Solution**: 
1. Use `ALTER TABLE IF EXISTS`
2. Ensure CREATE migrations run before ALTER migrations
3. Check migration filename ordering (timestamp determines execution order)

### Skipped Migrations
**Cause**: Filename doesn't match required pattern

**Solution**:
1. Rename files to follow `YYYYMMDDHHMMSS_description.sql` pattern
2. Run `node scripts/check-migration-filenames.mjs` locally to validate

### Foreign Key Constraint Errors
**Cause**: Referencing `auth.users` or non-existent tables

**Solution**:
1. Use `public.profiles` instead of `auth.users`
2. Add conditional FK creation as shown above
3. Use plain UUID columns if FK isn't critical

## Examples

### Safe Historical Work Orders Migration
```sql
-- 20250818120000_add_historical_work_orders.sql
DO $$ 
BEGIN
  -- Only proceed if work_orders table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'work_orders') THEN
    
    -- Add historical columns safely
    ALTER TABLE public.work_orders 
    ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS historical_start_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS historical_notes TEXT,
    ADD COLUMN IF NOT EXISTS created_by_admin UUID;
    
    -- Add FK to profiles if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'profiles') THEN
      
      -- Check if constraint doesn't already exist
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE constraint_name = 'work_orders_created_by_admin_fkey') THEN
        ALTER TABLE public.work_orders 
        ADD CONSTRAINT work_orders_created_by_admin_fkey 
        FOREIGN KEY (created_by_admin) REFERENCES public.profiles(id);
      END IF;
      
    END IF;
    
  ELSE
    -- Log that table doesn't exist (will appear in migration logs)
    RAISE NOTICE 'work_orders table does not exist, skipping historical columns addition';
  END IF;
END $$;
```

## Regular Maintenance

### Weekly Checks
- Review migration logs for any warnings or notices
- Ensure all migration files follow naming conventions
- Test migrations in development environment

### Before Releases
- Run full migration test on clean database
- Verify all filename patterns are correct
- Check for any hardcoded references to auth.users

## Tools and Scripts

### Local Validation
```bash
# Check migration filenames
node scripts/check-migration-filenames.mjs

# Run tests with migration checks
npm run test:ci
```

### CI Integration
Migration filename validation is automatically included in:
- `scripts/test-ci.mjs` - Runs before tests
- GitHub Actions CI pipeline
- Local test runs

This ensures migration issues are caught early in the development process.