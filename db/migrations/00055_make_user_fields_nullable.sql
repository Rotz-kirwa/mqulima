-- Migration: Make secondary user fields nullable for streamlined registration
-- Allows fast 5-field Sign Up (First Name, Last Name, Email, Password, Confirm Password)

ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE users ALTER COLUMN national_id DROP NOT NULL;
ALTER TABLE users ALTER COLUMN county DROP NOT NULL;
ALTER TABLE users ALTER COLUMN delivery_location DROP NOT NULL;
ALTER TABLE users ALTER COLUMN farming_type DROP NOT NULL;

-- Ensure sync trigger gracefully handles NULL values
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
        sync_address := COALESCE(NEW.delivery_location, 'Kenya') || ' (Landmark: ' || NEW.landmark || ')';
    ELSE
        sync_address := COALESCE(NEW.delivery_location, 'Kenya');
    END IF;

    -- Format sync farming type
    IF NEW.farming_type = 'Other' AND NEW.specify_farming_type IS NOT NULL AND NEW.specify_farming_type <> '' THEN
        sync_farming := NEW.specify_farming_type;
    ELSE
        sync_farming := COALESCE(NEW.farming_type, 'General Agriculture');
    END IF;

    IF (TG_OP = 'INSERT') THEN
        base_username := 'mqulima_' || LOWER(COALESCE(NEW.first_name, 'user')) || LOWER(COALESCE(NEW.last_name, ''));
        base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
        IF base_username = 'mqulima_' OR base_username = '' THEN
            base_username := 'mqulima_user';
        END IF;
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
            country,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            NEW.password_hash,
            TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')),
            gen_username,
            NEW.phone_number,
            NEW.national_id,
            sync_address,
            sync_farming,
            COALESCE(NEW.county, 'Nairobi'),
            'farmer',
            'Kenya',
            NEW.created_at,
            NEW.created_at
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE profiles SET
            email = NEW.email,
            password_hash = NEW.password_hash,
            full_name = TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')),
            phone = NEW.phone_number,
            id_number = NEW.national_id,
            delivery_address = sync_address,
            nature_of_agriculture = sync_farming,
            county_region = COALESCE(NEW.county, 'Nairobi'),
            updated_at = NOW()
        WHERE id = NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles SET deleted_at = NOW() WHERE id = OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
