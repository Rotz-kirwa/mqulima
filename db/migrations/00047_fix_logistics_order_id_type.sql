-- Migration: 00047_fix_logistics_order_id_type.sql
-- Description: Alter logistics_records.order_id from VARCHAR to UUID with foreign key constraint referencing orders(id)

DO $$ 
BEGIN 
  -- 1. Alter column type to UUID using explicit cast if currently varchar
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'logistics_records' 
      AND column_name = 'order_id' 
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.logistics_records 
    ALTER COLUMN order_id TYPE UUID USING order_id::uuid;
  END IF;

  -- 2. Add foreign key constraint if not exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_logistics_records_order' 
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.logistics_records
    ADD CONSTRAINT fk_logistics_records_order
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_logistics_records_order_id 
ON public.logistics_records (order_id);
