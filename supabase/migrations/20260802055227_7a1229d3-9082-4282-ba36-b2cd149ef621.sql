
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_project_role(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  user_count int;
  ref_code text;
  ref_user uuid;
begin
  ref_code := new.raw_user_meta_data->>'ref';
  IF ref_code IS NOT NULL THEN
    SELECT id INTO ref_user FROM public.profiles WHERE referral_code = ref_code LIMIT 1;
  END IF;

  insert into public.profiles (id, display_name, avatar_url, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'CIVIL-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),
    ref_user
  )
  on conflict (id) do nothing;

  IF ref_user IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, status)
    VALUES (ref_user, new.id, 'pending')
    ON CONFLICT (referred_user_id) DO NOTHING;
  END IF;

  select count(*) into user_count from auth.users;
  if user_count = 1 or lower(new.email) in ('zobaerhasan451@gmail.com','zobaerhasan431@gmail.com','zobaerhasan43@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  end if;
  return new;
exception when others then
  return new;
end;
$function$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) IN ('zobaerhasan451@gmail.com','zobaerhasan431@gmail.com','zobaerhasan43@gmail.com')
ON CONFLICT DO NOTHING;
