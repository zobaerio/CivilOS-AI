
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  message text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;

create policy "own notifications select" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "own notifications insert" on public.notifications
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own notifications update" on public.notifications
  for update to authenticated using (auth.uid() = user_id);
create policy "own notifications delete" on public.notifications
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
