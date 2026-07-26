-- Issue reports -- lets any player flag a broken track/clue (bad Spotify
-- link, wrong year, wrong answer) for the family to review later.
--
-- Unlike game_results (host-only insert), this is open to ANY signed-in
-- device: any player might notice a problem, not just the host. Consistent
-- with this repo's family-trust threat model (see supabase/README.md), any
-- signed-in device may also mark a report reviewed once it's been handled --
-- no separate host-only or reporter-only semantics.

create table if not exists public.issue_reports (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references public.rooms (id) on delete set null,
  game_slug   text not null,
  item_id     text not null,
  item_label  text,
  reason      text not null check (char_length(reason) between 1 and 500),
  reported_at timestamptz not null default now(),
  reviewed    boolean not null default false
);

create index if not exists issue_reports_slug_idx on public.issue_reports (game_slug, reported_at desc);
create index if not exists issue_reports_reviewed_idx on public.issue_reports (reviewed, reported_at desc);

alter table public.issue_reports enable row level security;

-- Any signed-in device can read every report (it's a shared family review
-- queue, not scoped to a single room).
drop policy if exists issue_reports_select on public.issue_reports;
create policy issue_reports_select on public.issue_reports
  for select to authenticated
  using (true);

-- Any signed-in device can file a report -- solo play too, hence room_id is
-- nullable and not checked against is_room_host here (unlike game_results).
drop policy if exists issue_reports_insert on public.issue_reports;
create policy issue_reports_insert on public.issue_reports
  for insert to authenticated
  with check (true);

-- Any signed-in device can toggle `reviewed` once it's been looked at.
drop policy if exists issue_reports_update on public.issue_reports;
create policy issue_reports_update on public.issue_reports
  for update to authenticated
  using (true)
  with check (true);
