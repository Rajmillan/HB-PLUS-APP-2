-- ==============================================================================
-- HBPLUS PHASE 2: Database Profiles, Strict RLS Policies & Admin Security
-- ==============================================================================
-- 
-- Security Boundaries:
-- 1. Exact email domain enforcement: lower(trim(email)) ends with @hbplus.fit
-- 2. Profiles table with primary key referencing auth.users(id) on delete cascade
-- 3. Explicit Row Level Security (RLS) on all tables (SELECT, INSERT, UPDATE)
-- 4. Automatic profile provisioning via SECURITY DEFINER trigger on auth.users
-- 5. Immutability of 'role' field for client requests via trigger + policy WITH CHECK
-- 6. Admin announcements table strictly protected by public.is_admin() server function
-- 
-- HOW TO PROMOTE THE FIRST ADMIN SAFELY:
-- Run the following in the Supabase Dashboard SQL Editor (service role):
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'authorized_admin@hbplus.fit';
-- ==============================================================================

-- 1. Helper function to validate exact @hbplus.fit email domain
CREATE OR REPLACE FUNCTION public.is_allowed_hbplus_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT user_email IS NOT NULL
     AND length(trim(user_email)) > 11
     AND lower(trim(user_email)) LIKE '%@hbplus.fit'
     -- Require exactly one '@' character to prevent multi-at injection
     AND (length(trim(user_email)) - length(replace(trim(user_email), '@', ''))) = 1;
$$;

-- 2. Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index justifications:
-- 1. id is the primary key and automatically indexed by PostgreSQL.
-- 2. role is used in security policies and admin checks (e.g. is_admin()).
-- 3. email is frequently checked in security domain validation and user queries.
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Profiles RLS Policies:
-- A. SELECT: Authenticated users can only read their own profile, and only if verified @hbplus.fit
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  AND public.is_allowed_hbplus_email(auth.jwt() ->> 'email')
  AND public.is_allowed_hbplus_email(email)
);

-- B. INSERT: Least-privilege insert policy (for client fallback if trigger was delayed)
-- Strictly validates auth.uid(), valid @hbplus.fit domain, and forces role='user'
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND public.is_allowed_hbplus_email(auth.jwt() ->> 'email')
  AND public.is_allowed_hbplus_email(email)
  AND role = 'user'
);

-- C. UPDATE: Users can update their own display name or avatar, but CANNOT alter role
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;
CREATE POLICY "Users can update own profile except role"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  AND public.is_allowed_hbplus_email(auth.jwt() ->> 'email')
)
WITH CHECK (
  auth.uid() = id
  AND public.is_allowed_hbplus_email(auth.jwt() ->> 'email')
  AND public.is_allowed_hbplus_email(email)
  -- Role must match the existing role in database (cannot be escalated)
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

-- 5. Trigger defense-in-depth: Prevent role escalation from any authenticated client query
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- If the executing context is an authenticated end-user client
    IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot modify their own authorization role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_modification ON public.profiles;
CREATE TRIGGER trg_prevent_role_modification
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_modification();

-- 6. Trigger on auth.users for safe automatic profile provisioning on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Provision profile ONLY if user's email matches the exact @hbplus.fit domain
  IF NEW.email IS NOT NULL AND public.is_allowed_hbplus_email(NEW.email) THEN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
      NEW.id,
      lower(trim(NEW.email)),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
      'user'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
      avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 7. Admin-Only Example Capability: Admin Announcements
-- RLS-secured table accessible ONLY to users with verified role='admin' in public.profiles
CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard', 'urgent', 'critical')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- Server-side function to verify admin status from database table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND public.is_allowed_hbplus_email(email)
  );
$$;

-- Explicit RLS Policies for admin_announcements (Admin only)
DROP POLICY IF EXISTS "Admins can view admin announcements" ON public.admin_announcements;
CREATE POLICY "Admins can view admin announcements"
ON public.admin_announcements
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert admin announcements" ON public.admin_announcements;
CREATE POLICY "Admins can insert admin announcements"
ON public.admin_announcements
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update admin announcements" ON public.admin_announcements;
CREATE POLICY "Admins can update admin announcements"
ON public.admin_announcements
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete admin announcements" ON public.admin_announcements;
CREATE POLICY "Admins can delete admin announcements"
ON public.admin_announcements
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Seed an initial sample announcement (will be visible only to authenticated admins)
INSERT INTO public.admin_announcements (title, content, priority)
VALUES (
  'HBPLUS Phase 2 Security Architecture Live',
  'Row Level Security policies, automated profile triggers, and server-verified admin access controls are active.',
  'urgent'
)
ON CONFLICT DO NOTHING;
