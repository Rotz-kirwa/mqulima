-- ============================================================================
-- DB MIGRATION: 00003_auth_fix.sql
-- Replaces the placeholder admin password hash with a real bcrypt hash.
-- ============================================================================

-- Update any super_admin accounts (including Mqulima001@gmail.com and admin@mqulima.co.ke) with the real bcrypt hash
UPDATE profiles
SET password_hash = '$2b$10$NhGLlk4Y/27CInYAh4QwLe/G72C20Fo..Cbrv0RjHzRiRfqMSnCFK',
    updated_at = NOW()
WHERE role = 'super_admin';

-- If no super_admin exists, seed the default admin account
INSERT INTO profiles (email, password_hash, full_name, username, role, county_region)
SELECT 'admin@mqulima.co.ke', '$2b$10$NhGLlk4Y/27CInYAh4QwLe/G72C20Fo..Cbrv0RjHzRiRfqMSnCFK', 'Mqulima Admin', 'mqulima_admin', 'super_admin', 'Nairobi'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'super_admin');
