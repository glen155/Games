-- Cross-night family leaderboard.
--
-- Unlike rooms/players/game_state (scoped to a single room), this table is a
-- shared, family-wide history: any signed-in device may read it, but only the
-- room's own host may write the one row for that room's finished game.
-- Append-only -- no update/delete policy is defined.

create table if not exists public.game_results (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.rooms (id) on delete set null,
  game_slug   text not null,
  finished_at timestamptz not null default now(),
  summary     jsonb not null
);

create index if not exists game_results_slug_idx on public.game_results (game_slug, finished_at desc);

alter table public.game_results enable row level security;

drop policy if exists game_results_select on public.game_results;
create policy game_results_select on public.game_results
  for select to authenticated
  using (true);

drop policy if exists game_results_insert on public.game_results;
create policy game_results_insert on public.game_results
  for insert to authenticated
  with check (public.is_room_host(room_id));
