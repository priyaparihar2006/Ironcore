// NOT VALID leaves historical rows untouched while checking new/updated rows.
// No destructive cleanup or automatic normalization of existing accounts.
export const VALIDATION_SCHEMA_SQL = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='progress_weight_valid') THEN
    ALTER TABLE progress_records ADD CONSTRAINT progress_weight_valid CHECK
      ("weightKg" BETWEEN 20 AND 300 AND ("weightKg"::text::numeric * 10) = trunc("weightKg"::text::numeric * 10)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profile_measurements_valid') THEN
    ALTER TABLE profiles ADD CONSTRAINT profile_measurements_valid CHECK
      (height BETWEEN 100 AND 250 AND "currentWeight" BETWEEN 20 AND 300 AND "targetWeight" BETWEEN 20 AND 300
       AND "currentWeight"::text::numeric * 10 = trunc("currentWeight"::text::numeric * 10)
       AND "targetWeight"::text::numeric * 10 = trunc("targetWeight"::text::numeric * 10)
       AND ("bodyFatPercentage" IS NULL OR "bodyFatPercentage" BETWEEN 0 AND 100)
       AND ("muscleMass" IS NULL OR "muscleMass" BETWEEN 0 AND 100)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='progress_metrics_valid') THEN
    ALTER TABLE progress_records ADD CONSTRAINT progress_metrics_valid CHECK
      ("caloriesBurned" BETWEEN 0 AND 20000 AND steps BETWEEN 0 AND 200000 AND "strengthScore" BETWEEN 0 AND 100 AND (notes IS NULL OR length(notes)<=2000)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_identity_valid') THEN
    ALTER TABLE users ADD CONSTRAINT user_identity_valid CHECK
      (length(btrim(name)) BETWEEN 2 AND 100 AND name !~ '[[:cntrl:]<>]'
       AND length(email)<=254 AND email ~ '^[^[:space:]@]+@[^[:space:]@.]+([.][^[:space:]@.]+)+$'
       AND email NOT LIKE '%..%'
       AND (phone IS NULL OR phone='' OR (length(phone)<=32 AND phone ~ '^[+0-9 ()-]+$')))
      NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='password_hash_format_valid') THEN
    ALTER TABLE users ADD CONSTRAINT password_hash_format_valid CHECK
      ("passwordHash" ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$'
       OR "passwordHash" ~ '^scrypt-v1[$][a-f0-9]{32}[$][a-f0-9]{128}$') NOT VALID;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS users_email_normalized_lookup ON users (lower(btrim(email)));
-- Install uniqueness if legacy data permits it. A trigger below still protects
-- new addresses when old case-variant duplicates require manual reconciliation.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM users GROUP BY lower(btrim(email)) HAVING count(*)>1) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_normalized_unique ON users (lower(btrim(email)));
  END IF;
END $$;
CREATE OR REPLACE FUNCTION ironcore_unique_email() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.email IS NOT DISTINCT FROM OLD.email THEN RETURN NEW; END IF;
  PERFORM pg_advisory_xact_lock(73180421);
  IF EXISTS (SELECT 1 FROM users WHERE lower(btrim(email))=lower(btrim(NEW.email)) AND id<>NEW.id) THEN
    RAISE EXCEPTION 'Email is already registered' USING ERRCODE='23505', CONSTRAINT='users_email_normalized_unique';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS ironcore_unique_email ON users;
CREATE TRIGGER ironcore_unique_email BEFORE INSERT OR UPDATE OF email ON users
  FOR EACH ROW EXECUTE FUNCTION ironcore_unique_email();
`;
