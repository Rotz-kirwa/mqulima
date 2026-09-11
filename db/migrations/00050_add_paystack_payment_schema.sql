-- ============================================================================
-- MQULIMA PLATFORM MIGRATION: 00050_add_paystack_payment_schema.sql
-- Paystack Card Payment Schema Enhancements
-- ============================================================================

-- 1. Add 'paystack' to payment_method_enum if not already present
ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'paystack';

-- 2. Enhance payments table with customer_email and gateway_response columns
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS gateway_response JSONB;

-- 3. Create indexes for fast lookup during callback and webhook processing
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_provider_status ON payments(provider, status);
