-- ============================================================================
-- 00045_allow_guest_service_requests_and_orders.sql
-- Drop NOT NULL constraint on user_id columns in service_requests and orders
-- to allow guest bookings and checkouts without admin profile FK pollution.
-- ============================================================================

ALTER TABLE service_requests ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
