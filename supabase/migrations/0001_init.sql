-- Games platform — core schema + Row Level Security.
--
-- Security model (this is the actual boundary, not the anon key):
--   * Every device signs in anonymously, so each has a stable auth.uid().
--   * A room is readable by any signed-in device (you must know the 6-char code
--     to look it up — the code is the gate; ~887M combinations, short-lived).
--   * Only the room's host may write authoritative game state.
--   * Only the host or a joined member may read a room's game state / players.
--
-- Enable "Anonymous sign-ins" in Supabase: Authentication -> Providers -> Anonymous.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  game_slug   text not null,
  host_user_id uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'lobby' check (status in ('lobby', 'active', 'ended')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '12 hours'
);

create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists rooms_host_idx on public.rooms (host_user_id);

create table if not exists public.players (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid not null references public.rooms (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  nickname  text not null check (char_length(nickname) between 1 and 40),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index if not exists players_room_idx on public.players (room_id);

create table if not exists public.game_state (
  room_id    uuid primary key references public.rooms (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper predicates (security definer so policies can consult other tables
-- without recursing through their own RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_room_host(target_room uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = target_room and r.host_user_id = auth.uid()
  );
$$;

create or replace function public.is_room_member(target_room uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_room_host(target_room)
    or exists (
      select 1 from public.players p
      where p.room_id = target_room and p.user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.rooms      enable row level security;
alter table public.players    enable row level security;
alter table public.game_state enable row level security;

-- rooms: any signed-in device may look up a room (needs the code to find it);
-- only the host may create/update/delete their own rooms.
drop policy if exists rooms_select on public.rooms;
create policy rooms_select on public.rooms
  for select to authenticated
  using (true);

drop policy if exists rooms_insert on public.rooms;
create policy rooms_insert on public.rooms
  for insert to authenticated
  with check (host_user_id = auth.uid());

drop policy if exists rooms_update on public.rooms;
create policy rooms_update on public.rooms
  for update to authenticated
  using (host_user_id = auth.uid())
  with check (host_user_id = auth.uid());

drop policy if exists rooms_delete on public.rooms;
create policy rooms_delete on public.rooms
  for delete to authenticated
  using (host_user_id = auth.uid());

-- players: a device may add itself to a room; a member (or host) may read the
-- roster; a device may remove/update only its own row.
drop policy if exists players_select on public.players;
create policy players_select on public.players
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists players_insert on public.players;
create policy players_insert on public.players
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists players_update on public.players;
create policy players_update on public.players
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists players_delete on public.players;
create policy players_delete on public.players
  for delete to authenticated
  using (user_id = auth.uid() or public.is_room_host(room_id));

-- game_state: only the host may write; host + members may read (for catch-up).
drop policy if exists game_state_select on public.game_state;
create policy game_state_select on public.game_state
  for select to authenticated
  using (public.is_room_member(room_id));

drop policy if exists game_state_insert on public.game_state;
create policy game_state_insert on public.game_state
  for insert to authenticated
  with check (public.is_room_host(room_id));

drop policy if exists game_state_update on public.game_state;
create policy game_state_update on public.game_state
  for update to authenticated
  using (public.is_room_host(room_id))
  with check (public.is_room_host(room_id));

-- ---------------------------------------------------------------------------
-- Housekeeping: purge expired rooms. Schedule via pg_cron (see README) or call
-- manually. game_state / players cascade-delete with their room.
-- ---------------------------------------------------------------------------

create or replace function public.purge_expired_rooms()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rooms where expires_at < now();
$$;
