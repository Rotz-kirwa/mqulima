-- Migration: Create users table, farming_type enum, and sync trigger to profiles

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'farming_type') THEN
        CREATE TYPE farming_type AS ENUM (
            'Crop Farming (Horticulture)',
            'Crop Farming (Cereals & Grains)',
            'Livestock Farming',
            'Dairy Farming',
            'Poultry Farming',
            'Aquaculture',
            'Mixed Farming',
            'Agroforestry',
            'I''m a Buyer/Consumer Only (no farming)'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  phone_number        TEXT UNIQUE NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  national_id         TEXT UNIQUE NOT NULL,
  county              TEXT NOT NULL,
  delivery_location   TEXT NOT NULL,
  farming_type        farming_type NOT NULL,
  password_hash       TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to sync users into profiles table for backward compatibility
CREATE OR REPLACE FUNCTION sync_users_to_profiles()
RETURNS TRIGGER AS $$
DECLARE
    gen_username TEXT;
    base_username TEXT;
    counter INT := 0;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        base_username := 'mqulima_' || LOWER(NEW.first_name) || LOWER(NEW.last_name);
        base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
        gen_username := base_username;
        
        WHILE EXISTS (SELECT 1 FROM profiles WHERE username = gen_username) LOOP
            counter := counter + 1;
            gen_username := base_username || counter::TEXT;
        END LOOP;

        INSERT INTO profiles (
            id,
            email,
            password_hash,
            full_name,
            username,
            phone,
            id_number,
            delivery_address,
            nature_of_agriculture,
            county_region,
            role,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            NEW.password_hash,
            NEW.first_name || ' ' || NEW.last_name,
            gen_username,
            NEW.phone_number,
            NEW.national_id,
            NEW.delivery_location,
            NEW.farming_type::TEXT,
            NEW.county,
            'farmer',
            NEW.created_at,
            NEW.created_at
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE profiles SET
            email = NEW.email,
            password_hash = NEW.password_hash,
            full_name = NEW.first_name || ' ' || NEW.last_name,
            phone = NEW.phone_number,
            id_number = NEW.national_id,
            delivery_address = NEW.delivery_location,
            nature_of_agriculture = NEW.farming_type::TEXT,
            county_region = NEW.county,
            updated_at = NOW()
        WHERE id = NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles SET deleted_at = NOW() WHERE id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_users_to_profiles ON users;

CREATE TRIGGER trigger_sync_users_to_profiles
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_users_to_profiles();
