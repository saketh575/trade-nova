create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

drop policy if exists "Users can read their own Trade Nova state" on public.user_app_state;
create policy "Users can read their own Trade Nova state"
  on public.user_app_state for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own Trade Nova state" on public.user_app_state;
create policy "Users can insert their own Trade Nova state"
  on public.user_app_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Trade Nova state" on public.user_app_state;
create policy "Users can update their own Trade Nova state"
  on public.user_app_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_app_state to authenticated;

create or replace function public.merge_trade_nova_state(state_patch jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.user_app_state (user_id, payload, updated_at)
  values (auth.uid(), state_patch, now())
  on conflict (user_id) do update
    set payload = public.user_app_state.payload || excluded.payload,
        updated_at = now()
  where public.user_app_state.user_id = auth.uid();
$$;

grant execute on function public.merge_trade_nova_state(jsonb) to authenticated;
