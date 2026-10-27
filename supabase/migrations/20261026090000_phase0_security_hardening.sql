-- Phase 0 hardening: remove first-user admin bootstrap and protect enquiries.

DROP TRIGGER IF EXISTS on_auth_user_created_grant_role ON auth.users;
DROP FUNCTION IF EXISTS public.grant_first_user_admin();

-- Signups are closed even if Supabase's open-signup setting is re-enabled:
-- only emails in this allowlist may create an account.
CREATE TABLE IF NOT EXISTS public.owner_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_allowlist ENABLE ROW LEVEL SECURITY;

INSERT INTO public.owner_allowlist (email)
SELECT u.email
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'admin'
WHERE u.email IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.enforce_owner_allowlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.owner_allowlist
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    RAISE EXCEPTION 'signup_not_allowed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_owner_allowlist_trigger ON auth.users;
CREATE TRIGGER enforce_owner_allowlist_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_owner_allowlist();

ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS ip_hash text;

CREATE INDEX IF NOT EXISTS enquiries_ip_hash_created_at_idx
  ON public.enquiries (ip_hash, created_at DESC);

DROP POLICY IF EXISTS "Anyone can send an enquiry" ON public.enquiries;
REVOKE INSERT ON public.enquiries FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_enquiry(
  _name text,
  _email text,
  _phone text,
  _interest text,
  _message text,
  _ip_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  recent_count integer;
BEGIN
  IF length(coalesce(_name, '')) < 2
     OR length(_name) > 120
     OR length(coalesce(_email, '')) < 3
     OR length(_email) > 180
     OR coalesce(_email, '') !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     OR length(coalesce(_message, '')) < 5
     OR length(_message) > 2000
     OR length(coalesce(_phone, '')) > 40
     OR length(coalesce(_interest, '')) > 120 THEN
    RAISE EXCEPTION 'invalid_enquiry' USING ERRCODE = '22023';
  END IF;

  IF _ip_hash IS NOT NULL THEN
    SELECT count(*)
      INTO recent_count
      FROM public.enquiries
     WHERE ip_hash = _ip_hash
       AND created_at > now() - interval '1 hour';

    IF recent_count >= 5 THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.enquiries (name, email, phone, interest, message, ip_hash)
  VALUES (
    trim(_name),
    lower(trim(_email)),
    coalesce(_phone, ''),
    coalesce(nullif(trim(_interest), ''), 'General'),
    trim(_message),
    _ip_hash
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_enquiry(text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_enquiry(text, text, text, text, text, text)
  TO service_role;
