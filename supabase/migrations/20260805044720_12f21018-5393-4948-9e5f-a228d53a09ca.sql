ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS accepted_by uuid,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS invitations_one_pending_per_email_project
ON public.invitations (project_id, lower(trim(invited_email)))
WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN auth.users au ON au.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        _role <> 'admin'::public.app_role
        OR lower(trim(au.email)) IN ('zobaerio24@gmail.com', 'zobaerhasan431@gmail.com')
      )
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code text;
  ref_user uuid;
  normalized_email text := lower(trim(new.email));
BEGIN
  ref_code := new.raw_user_meta_data->>'ref';
  IF ref_code IS NOT NULL THEN
    SELECT id INTO ref_user FROM public.profiles WHERE referral_code = ref_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, display_name, avatar_url, referral_code, referred_by)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'CIVIL-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),
    ref_user
  )
  ON CONFLICT (id) DO NOTHING;

  IF ref_user IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, status)
    VALUES (ref_user, new.id, 'pending')
    ON CONFLICT (referred_user_id) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    CASE WHEN normalized_email IN ('zobaerio24@gmail.com', 'zobaerhasan431@gmail.com')
      THEN 'admin'::public.app_role ELSE 'user'::public.app_role END
  )
  ON CONFLICT DO NOTHING;
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

DROP POLICY IF EXISTS "Invitee updates own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Invitee views own invitations" ON public.invitations;
CREATE POLICY "Invitee views own valid invitations" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    lower(trim(invited_email)) = lower(trim(auth.jwt() ->> 'email'))
    AND status = 'pending'
    AND expires_at > now()
  );

CREATE OR REPLACE FUNCTION public.accept_project_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invitations%ROWTYPE;
  caller_email text := lower(trim(auth.jwt() ->> 'email'));
BEGIN
  IF auth.uid() IS NULL OR caller_email IS NULL OR length(caller_email) = 0 THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO inv
  FROM public.invitations
  WHERE token = _token
  FOR UPDATE;

  IF inv.id IS NULL OR inv.status <> 'pending' OR inv.expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation is invalid or expired';
  END IF;
  IF lower(trim(inv.invited_email)) <> caller_email THEN
    RAISE EXCEPTION 'This invitation belongs to another email address';
  END IF;

  INSERT INTO public.project_members (project_id, user_id, role, invited_by, status)
  VALUES (inv.project_id, auth.uid(), inv.role, inv.invited_by, 'accepted')
  ON CONFLICT (project_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, status = 'accepted', invited_by = EXCLUDED.invited_by;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
  WHERE id = inv.id AND status = 'pending';

  INSERT INTO public.notifications (user_id, project_id, type, title, message, link)
  VALUES (inv.invited_by, inv.project_id, 'member_joined', 'New member joined', caller_email || ' joined your project.', '/projects/' || inv.project_id);

  RETURN inv.project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_project_invitation(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed integer;
BEGIN
  UPDATE public.invitations
  SET status = 'rejected'
  WHERE token = _token
    AND status = 'pending'
    AND expires_at > now()
    AND lower(trim(invited_email)) = lower(trim(auth.jwt() ->> 'email'));
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_project_invitation(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decline_project_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_project_invitation(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decline_project_invitation(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Uploader or admin delete documents" ON public.project_documents;
CREATE POLICY "Current uploader or admin delete documents" ON public.project_documents
  FOR DELETE TO authenticated
  USING (
    public.get_project_role(project_id, auth.uid()) = 'admin'
    OR (uploaded_by = auth.uid() AND public.is_project_member(project_id, auth.uid()))
  );