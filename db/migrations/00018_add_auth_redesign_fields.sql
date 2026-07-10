-- Migration: Update users table structure for auth redesign

-- 1. Alter farming_type column to TEXT to support any farming option
ALTER TABLE users ALTER COLUMN farming_type TYPE TEXT;

-- 2. Add columns for landmark and specify_farming_type
ALTER TABLE users ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specify_farming_type TEXT;

-- 3. Update sync trigger function to include landmark and custom farming type
CREATE OR REPLACE FUNCTION sync_users_to_profiles()
RETURNS TRIGGER AS $$
DECLARE
    gen_username TEXT;
    base_username TEXT;
    counter INT := 0;
    sync_address TEXT;
    sync_farming TEXT;
BEGIN
    -- Format sync address with landmark if present
    IF NEW.landmark IS NOT NULL AND NEW.landmark <> '' THEN
        sync_address := NEW.delivery_location || ' (Landmark: ' || NEW.landmark || ')';
    ELSE
        sync_address := NEW.delivery_location;
    END IF;

    -- Format sync farming type
    IF NEW.farming_type = 'Other' AND NEW.specify_farming_type IS NOT NULL AND NEW.specify_farming_type <> '' THEN
        sync_farming := NEW.specify_farming_type;
    ELSE
        sync_farming := NEW.farming_type;
    END IF;

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
            sync_address,
            sync_farming,
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
            delivery_address = sync_address,
            nature_of_agriculture = sync_farming,
            county_region = NEW.county,
            updated_at = NOW()
        WHERE id = NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles SET deleted_at = NOW() WHERE id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
