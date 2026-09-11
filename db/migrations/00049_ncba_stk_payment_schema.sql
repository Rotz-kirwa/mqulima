-- ============================================================================
-- MQULIMA PLATFORM MIGRATION: 00049_ncba_stk_payment_schema.sql
-- NCBA STK Push Payment System Schema Enhancements
-- ============================================================================

-- 1. Add NCBA to payment_method_enum if not already present
ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'ncba';

-- 2. Enhance payments table with reconciliation and audit columns
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS merchant_reference TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES',
  ADD COLUMN IF NOT EXISTS result_code TEXT,
  ADD COLUMN IF NOT EXISTS result_description TEXT,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 3. Create indexes for fast lookup during callbacks & admin queries
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider, provider_ref);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_ref ON payments(merchant_reference);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_number);
