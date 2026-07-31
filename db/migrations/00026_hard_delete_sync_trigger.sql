-- Migration: Hard delete synchronization between users and profiles, plus total purge of soft-deleted records

-- 1. Update sync_users_to_profiles function to hard DELETE from profiles when user is deleted
CREATE OR REPLACE FUNCTION sync_users_to_profiles()
RETURNS TRIGGER AS $$
DECLARE
    gen_username TEXT;
    base_username TEXT;
    counter INT := 0;
    sync_address TEXT;
    sync_farming TEXT;
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

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
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            id_number = EXCLUDED.id_number,
            delivery_address = EXCLUDED.delivery_address,
            nature_of_agriculture = EXCLUDED.nature_of_agriculture,
            county_region = EXCLUDED.county_region,
            updated_at = NOW();

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
        -- Hard delete profile when user is deleted
        DELETE FROM profiles WHERE id = OLD.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. Create reciprocal trigger for hard deletion on profiles -> users
CREATE OR REPLACE FUNCTION sync_profiles_deletion_to_users()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        DELETE FROM users WHERE id = OLD.id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_profiles_deletion_to_users ON profiles;
CREATE TRIGGER trigger_sync_profiles_deletion_to_users
AFTER DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profiles_deletion_to_users();

-- 3. Purge all existing soft-deleted records from profiles and users
DELETE FROM profiles WHERE deleted_at IS NOT NULL;
