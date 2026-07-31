-- Migration: Bi-directional synchronization from profiles to users and data reconciliation

-- 1. Update sync_users_to_profiles to prevent recursive trigger execution
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
        RETURN NEW;
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

-- 2. Create sync_profiles_to_users trigger function with pg_trigger_depth protection
CREATE OR REPLACE FUNCTION sync_profiles_to_users()
RETURNS TRIGGER AS $$
DECLARE
    split_first_name TEXT;
    split_last_name TEXT;
    space_pos INT;
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        -- Only proceed if user exists in users table
        IF EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
            space_pos := POSITION(' ' IN TRIM(NEW.full_name));
            IF space_pos > 0 THEN
                split_first_name := SUBSTRING(TRIM(NEW.full_name) FROM 1 FOR space_pos - 1);
                split_last_name := SUBSTRING(TRIM(NEW.full_name) FROM space_pos + 1);
            ELSE
                split_first_name := TRIM(NEW.full_name);
                split_last_name := '';
            END IF;

            UPDATE users SET
                first_name = split_first_name,
                last_name = split_last_name,
                email = NEW.email,
                phone_number = NEW.phone,
                national_id = NEW.id_number,
                county = NEW.county_region,
                delivery_location = COALESCE(NEW.delivery_address, delivery_location),
                farming_type = COALESCE(NEW.nature_of_agriculture, farming_type)
            WHERE id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to profiles
DROP TRIGGER IF EXISTS trigger_sync_profiles_to_users ON profiles;
CREATE TRIGGER trigger_sync_profiles_to_users
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profiles_to_users();

-- 4. Reconcile existing data between users and profiles
UPDATE users u
SET 
    email = p.email,
    phone_number = p.phone,
    national_id = COALESCE(p.id_number, u.national_id),
    county = COALESCE(p.county_region, u.county)
FROM profiles p
WHERE u.id = p.id AND (u.email <> p.email OR u.phone_number <> p.phone);

-- 5. Ensure any non-admin profiles missing from users table are inserted into users
INSERT INTO users (
    id,
    first_name,
    last_name,
    phone_number,
    email,
    national_id,
    county,
    delivery_location,
    farming_type,
    password_hash,
    created_at
)
SELECT 
    p.id,
    CASE 
        WHEN POSITION(' ' IN TRIM(p.full_name)) > 0 THEN SUBSTRING(TRIM(p.full_name) FROM 1 FOR POSITION(' ' IN TRIM(p.full_name)) - 1)
        ELSE TRIM(p.full_name)
    END,
    CASE 
        WHEN POSITION(' ' IN TRIM(p.full_name)) > 0 THEN SUBSTRING(TRIM(p.full_name) FROM POSITION(' ' IN TRIM(p.full_name)) + 1)
        ELSE ''
    END,
    COALESCE(p.phone, '+254700000000'),
    p.email,
    COALESCE(p.id_number, '00000000'),
    COALESCE(p.county_region, 'Nairobi'),
    COALESCE(p.delivery_address, 'Nairobi'),
    COALESCE(p.nature_of_agriculture, 'General Agriculture'),
    p.password_hash,
    p.created_at
FROM profiles p
WHERE p.deleted_at IS NULL
  AND p.role::text NOT IN ('super_admin', 'admin', 'sales_agent')
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id OR LOWER(u.email) = LOWER(p.email))
ON CONFLICT (id) DO NOTHING;
