
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles" on public.user_roles
  for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "Admins manage roles" on public.user_roles
  for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  display_name text,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.ratings enable row level security;
create policy "Ratings public read" on public.ratings for select using (true);
create policy "Auth users insert ratings" on public.ratings for insert with check (auth.uid() = user_id);
create policy "Users update own rating" on public.ratings for update using (auth.uid() = user_id);
create policy "Users delete own / admin delete" on public.ratings for delete
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website text,
  description text,
  contact_email text,
  status text not null default 'pending',
  featured boolean not null default false,
  submitted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sponsors enable row level security;
create policy "Active sponsors public" on public.sponsors for select
  using (status = 'active' or public.has_role(auth.uid(),'admin'));
create policy "Anyone can submit sponsor" on public.sponsors for insert with check (status = 'pending');
create policy "Admins manage sponsors" on public.sponsors for update using (public.has_role(auth.uid(),'admin'));
create policy "Admins delete sponsors" on public.sponsors for delete using (public.has_role(auth.uid(),'admin'));
create trigger sponsors_updated before update on public.sponsors
  for each row execute function public.set_updated_at();

alter table public.projects add column if not exists share_token text unique;
alter table public.projects add column if not exists is_public boolean not null default false;
create policy "Public projects via share token" on public.projects for select
  using (is_public = true and share_token is not null);

insert into storage.buckets (id, name, public) values ('avatars','avatars', true)
  on conflict (id) do nothing;

create policy "Avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users upload own avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update own avatar" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own avatar" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
