-- Safe migration to add historical work order support
-- Guards against missing work_orders table and uses safe column additions

DO $$ 
BEGIN
  -- Only proceed if work_orders table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'work_orders') THEN
    
    RAISE NOTICE 'Adding historical columns to work_orders table';
    
    -- Add historical columns safely (only if they don't exist)
    ALTER TABLE public.work_orders 
    ADD COLUMN IF NOT EXISTS is_historical BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS historical_start_date TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS historical_notes TEXT,
    ADD COLUMN IF NOT EXISTS created_by_admin UUID;
    
    -- Add FK to profiles if both tables exist and constraint doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'profiles') AND
       NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'work_orders_created_by_admin_fkey'
                   AND table_name = 'work_orders'
                   AND table_schema = 'public') THEN
      
      ALTER TABLE public.work_orders 
      ADD CONSTRAINT work_orders_created_by_admin_fkey 
      FOREIGN KEY (created_by_admin) REFERENCES public.profiles(id);
      
      RAISE NOTICE 'Added foreign key constraint for created_by_admin';
    END IF;
    
    -- Create index for performance if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'work_orders' 
                   AND indexname = 'idx_work_orders_historical') THEN
      CREATE INDEX idx_work_orders_historical 
      ON public.work_orders(is_historical, historical_start_date);
      
      RAISE NOTICE 'Created index for historical work orders';
    END IF;
    
    RAISE NOTICE 'Historical work order columns added successfully';
    
  ELSE
    RAISE NOTICE 'work_orders table does not exist, skipping historical columns addition';
  END IF;
END $$;