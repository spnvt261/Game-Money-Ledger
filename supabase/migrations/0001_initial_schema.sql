create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

set search_path = public, extensions;

create table if not exists public.configuration (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  role text not null default 'admin',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (btrim(display_name) <> ''),
  slug text not null unique check (btrim(slug) <> ''),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  game_type text not null check (game_type in ('TFT', 'BILLIARD')),
  status text not null default 'COMPLETED' check (status in ('COMPLETED', 'VOIDED')),
  note text,
  played_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_by_session_id uuid references public.app_sessions(id),
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text
);

create table if not exists public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id),
  player_id uuid not null references public.players(id),
  placement int,
  net_amount int not null,
  metadata jsonb not null default '{}'::jsonb,
  unique (match_id, player_id)
);

create table if not exists public.ledger_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('MATCH', 'VOID', 'SETTLEMENT', 'ADJUSTMENT')),
  match_id uuid references public.matches(id),
  note text,
  occurred_at timestamptz not null default now(),
  created_by_session_id uuid references public.app_sessions(id),
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_lines (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ledger_events(id),
  player_id uuid not null references public.players(id),
  amount int not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_app_sessions_expires_at on public.app_sessions (expires_at);
create index if not exists idx_players_is_active on public.players (is_active);
create index if not exists idx_matches_played_at_desc on public.matches (played_at desc);
create index if not exists idx_matches_game_type on public.matches (game_type);
create index if not exists idx_matches_status on public.matches (status);
create index if not exists idx_match_participants_match_id on public.match_participants (match_id);
create index if not exists idx_match_participants_player_id on public.match_participants (player_id);
create index if not exists idx_ledger_events_match_id on public.ledger_events (match_id);
create index if not exists idx_ledger_events_event_type on public.ledger_events (event_type);
create index if not exists idx_ledger_lines_event_id on public.ledger_lines (event_id);
create index if not exists idx_ledger_lines_player_id on public.ledger_lines (player_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger configuration_set_updated_at
before update on public.configuration
for each row execute function public.set_updated_at();

create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

create or replace function public.assert_ledger_event_balanced()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  v_event_id uuid;
  v_event_type text;
  v_match_id uuid;
  v_line_count int;
  v_total_amount bigint;
begin
  if tg_table_name = 'ledger_events' then
    v_event_id := coalesce(new.id, old.id);
  else
    v_event_id := coalesce(new.event_id, old.event_id);
  end if;

  select le.event_type, le.match_id
  into v_event_type, v_match_id
  from public.ledger_events le
  where le.id = v_event_id;

  if not found then
    return null;
  end if;

  if v_match_id is not null then
    select count(*), coalesce(sum(ll.amount), 0)
    into v_line_count, v_total_amount
    from public.ledger_lines ll
    where ll.event_id = v_event_id;

    if v_line_count = 0 then
      raise exception 'Ledger event % has no lines', v_event_id;
    end if;

    if v_total_amount <> 0 then
      raise exception 'Ledger event % is not balanced: %', v_event_id, v_total_amount;
    end if;
  end if;

  return null;
end;
$$;

create constraint trigger ledger_events_balanced_after_change
after insert or update on public.ledger_events
deferrable initially deferred
for each row execute function public.assert_ledger_event_balanced();

create constraint trigger ledger_lines_balanced_after_change
after insert or update or delete on public.ledger_lines
deferrable initially deferred
for each row execute function public.assert_ledger_event_balanced();

create or replace view public.v_player_balances
with (security_invoker = true)
as
with ledger_balances as (
  select
    ll.player_id,
    coalesce(sum(ll.amount), 0)::bigint as balance_amount
  from public.ledger_lines ll
  group by ll.player_id
),
completed_match_counts as (
  select
    mp.player_id,
    count(distinct mp.match_id)::bigint as match_count
  from public.match_participants mp
  join public.matches m on m.id = mp.match_id
  where m.status = 'COMPLETED'
  group by mp.player_id
)
select
  p.id as player_id,
  p.display_name,
  p.avatar_url,
  p.is_active,
  coalesce(lb.balance_amount, 0)::bigint as balance_amount,
  coalesce(cmc.match_count, 0)::bigint as match_count
from public.players p
left join ledger_balances lb on lb.player_id = p.id
left join completed_match_counts cmc on cmc.player_id = p.id;

create or replace view public.v_match_history
with (security_invoker = true)
as
select
  m.id as match_id,
  m.game_type,
  m.status,
  m.played_at,
  m.note,
  count(mp.id)::bigint as participant_count,
  coalesce(sum(case when mp.net_amount > 0 then mp.net_amount else 0 end), 0)::bigint as total_positive_amount,
  coalesce(sum(case when mp.net_amount < 0 then mp.net_amount else 0 end), 0)::bigint as total_negative_amount
from public.matches m
left join public.match_participants mp on mp.match_id = m.id
group by m.id, m.game_type, m.status, m.played_at, m.note;

create or replace view public.v_dashboard_summary
with (security_invoker = true)
as
select
  (select count(*)::bigint from public.players) as total_players,
  (select count(*)::bigint from public.players where is_active) as active_players,
  (select count(*)::bigint from public.matches) as total_matches,
  (select count(*)::bigint from public.matches where status = 'COMPLETED') as total_completed_matches,
  (select count(*)::bigint from public.matches where status = 'VOIDED') as total_voided_matches,
  (
    select coalesce(sum(case when mp.net_amount > 0 then mp.net_amount else 0 end), 0)::bigint
    from public.match_participants mp
    join public.matches m on m.id = mp.match_id
    where m.status = 'COMPLETED'
  ) as total_money_moved;

create or replace view public.v_player_stats
with (security_invoker = true)
as
with match_stats as (
  select
    mp.player_id,
    count(distinct mp.match_id)::bigint as total_matches,
    coalesce(sum(case when mp.net_amount > 0 then mp.net_amount else 0 end), 0)::bigint as total_win_amount,
    coalesce(sum(case when mp.net_amount < 0 then mp.net_amount else 0 end), 0)::bigint as total_loss_amount
  from public.match_participants mp
  join public.matches m on m.id = mp.match_id
  where m.status = 'COMPLETED'
  group by mp.player_id
),
ledger_balances as (
  select
    ll.player_id,
    coalesce(sum(ll.amount), 0)::bigint as balance_amount
  from public.ledger_lines ll
  group by ll.player_id
)
select
  p.id as player_id,
  p.display_name,
  coalesce(ms.total_matches, 0)::bigint as total_matches,
  coalesce(ms.total_win_amount, 0)::bigint as total_win_amount,
  coalesce(ms.total_loss_amount, 0)::bigint as total_loss_amount,
  coalesce(lb.balance_amount, 0)::bigint as balance_amount
from public.players p
left join match_stats ms on ms.player_id = p.id
left join ledger_balances lb on lb.player_id = p.id;

create or replace function public.check_admin_key(input_key text)
returns table (
  session_token text,
  role text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin_key_hash text;
  v_session_token text;
  v_token_hash text;
  v_expires_at timestamptz := now() + interval '30 days';
begin
  if input_key is null or btrim(input_key) = '' then
    raise exception 'Admin key is required' using errcode = '28000';
  end if;

  select
    case jsonb_typeof(c.value)
      when 'object' then c.value ->> 'hash'
      when 'string' then trim(both '"' from c.value::text)
      else null
    end
  into v_admin_key_hash
  from public.configuration c
  where c.key = 'admin_key_hash';

  if v_admin_key_hash is null or v_admin_key_hash = '' then
    raise exception 'Admin key hash is not configured' using errcode = '28000';
  end if;

  if crypt(input_key, v_admin_key_hash) <> v_admin_key_hash then
    raise exception 'Invalid admin key' using errcode = '28000';
  end if;

  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := crypt(v_session_token, gen_salt('bf'));

  insert into public.app_sessions (token_hash, role, expires_at)
  values (v_token_hash, 'admin', v_expires_at);

  return query
  select v_session_token, 'admin'::text, v_expires_at;
end;
$$;

create or replace function public.verify_session(session_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session_id uuid;
begin
  if session_token is null or btrim(session_token) = '' then
    raise exception 'Session token is required' using errcode = '28000';
  end if;

  select s.id
  into v_session_id
  from public.app_sessions s
  where s.expires_at > now()
    and crypt(session_token, s.token_hash) = s.token_hash
  order by s.created_at desc
  limit 1;

  if v_session_id is null then
    raise exception 'Invalid or expired session' using errcode = '28000';
  end if;

  return v_session_id;
end;
$$;

create or replace function public.create_match(payload jsonb, session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session_id uuid;
  v_game_type text;
  v_played_at timestamptz;
  v_note text;
  v_metadata jsonb;
  v_participants jsonb;
  v_participant_count int;
  v_invalid_count int;
  v_distinct_players int;
  v_existing_players int;
  v_distinct_placements int;
  v_total_amount bigint;
  v_total_positive bigint;
  v_total_negative bigint;
  v_match_id uuid;
  v_event_id uuid;
begin
  v_session_id := public.verify_session(session_token);

  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Payload must be a JSON object';
  end if;

  v_game_type := upper(payload ->> 'game_type');
  if v_game_type is null or v_game_type not in ('TFT', 'BILLIARD') then
    raise exception 'Invalid game_type. Expected TFT or BILLIARD';
  end if;

  if nullif(payload ->> 'played_at', '') is null then
    v_played_at := now();
  else
    v_played_at := (payload ->> 'played_at')::timestamptz;
  end if;

  v_note := nullif(btrim(payload ->> 'note'), '');
  v_metadata := coalesce(payload -> 'metadata', '{}'::jsonb);
  if jsonb_typeof(v_metadata) <> 'object' then
    raise exception 'metadata must be a JSON object';
  end if;

  v_participants := payload -> 'participants';
  if v_participants is null or jsonb_typeof(v_participants) <> 'array' then
    raise exception 'participants must be a JSON array';
  end if;

  v_participant_count := jsonb_array_length(v_participants);
  if v_participant_count < 2 then
    raise exception 'A match requires at least 2 participants';
  end if;

  select count(*)::int
  into v_invalid_count
  from jsonb_array_elements(v_participants) as p(item)
  where jsonb_typeof(p.item) <> 'object'
    or not (p.item ? 'player_id')
    or (p.item ->> 'player_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or not (p.item ? 'net_amount')
    or jsonb_typeof(p.item -> 'net_amount') not in ('number', 'string')
    or (p.item ->> 'net_amount') !~ '^-?\d+$'
    or (
      (p.item ? 'placement')
      and nullif(p.item ->> 'placement', '') is not null
      and (p.item ->> 'placement') !~ '^\d+$'
    )
    or (
      (p.item ? 'metadata')
      and jsonb_typeof(p.item -> 'metadata') <> 'object'
    );

  if v_invalid_count > 0 then
    raise exception 'Invalid participants payload';
  end if;

  select count(distinct p.item ->> 'player_id')::int
  into v_distinct_players
  from jsonb_array_elements(v_participants) as p(item);

  if v_distinct_players <> v_participant_count then
    raise exception 'Participants must not contain duplicate players';
  end if;

  select count(*)::int
  into v_existing_players
  from (
    select distinct (p.item ->> 'player_id')::uuid as player_id
    from jsonb_array_elements(v_participants) as p(item)
  ) parsed
  join public.players pl on pl.id = parsed.player_id and pl.is_active;

  if v_existing_players <> v_participant_count then
    raise exception 'All participants must be active players';
  end if;

  if v_game_type = 'TFT' then
    if v_participant_count not in (3, 4) then
      raise exception 'TFT matches require 3 or 4 participants';
    end if;

    with parsed as (
      select
        case
          when p.item ? 'placement' and nullif(p.item ->> 'placement', '') is not null
            then (p.item ->> 'placement')::int
          else null
        end as placement
      from jsonb_array_elements(v_participants) as p(item)
    )
    select count(*)::int
    into v_invalid_count
    from parsed
    where placement is null
      or placement < 1
      or placement > v_participant_count;

    if v_invalid_count > 0 then
      raise exception 'TFT participants require placement from 1 to participant count';
    end if;

    select count(distinct (p.item ->> 'placement')::int)::int
    into v_distinct_placements
    from jsonb_array_elements(v_participants) as p(item);

    if v_distinct_placements <> v_participant_count then
      raise exception 'TFT placements must be unique';
    end if;
  end if;

  select
    coalesce(sum((p.item ->> 'net_amount')::int), 0)::bigint,
    coalesce(sum(case when (p.item ->> 'net_amount')::int > 0 then (p.item ->> 'net_amount')::int else 0 end), 0)::bigint,
    coalesce(sum(case when (p.item ->> 'net_amount')::int < 0 then (p.item ->> 'net_amount')::int else 0 end), 0)::bigint
  into v_total_amount, v_total_positive, v_total_negative
  from jsonb_array_elements(v_participants) as p(item);

  if v_total_amount <> 0 then
    raise exception 'Total net_amount must equal 0';
  end if;

  insert into public.matches (
    game_type,
    status,
    note,
    played_at,
    metadata,
    created_by_session_id
  )
  values (
    v_game_type,
    'COMPLETED',
    v_note,
    v_played_at,
    v_metadata,
    v_session_id
  )
  returning id into v_match_id;

  insert into public.match_participants (
    match_id,
    player_id,
    placement,
    net_amount,
    metadata
  )
  select
    v_match_id,
    (p.item ->> 'player_id')::uuid,
    case
      when p.item ? 'placement' and nullif(p.item ->> 'placement', '') is not null
        then (p.item ->> 'placement')::int
      else null
    end,
    (p.item ->> 'net_amount')::int,
    coalesce(p.item -> 'metadata', '{}'::jsonb)
  from jsonb_array_elements(v_participants) as p(item);

  insert into public.ledger_events (
    event_type,
    match_id,
    note,
    occurred_at,
    created_by_session_id
  )
  values (
    'MATCH',
    v_match_id,
    v_note,
    v_played_at,
    v_session_id
  )
  returning id into v_event_id;

  insert into public.ledger_lines (
    event_id,
    player_id,
    amount,
    metadata
  )
  select
    v_event_id,
    (p.item ->> 'player_id')::uuid,
    (p.item ->> 'net_amount')::int,
    coalesce(p.item -> 'metadata', '{}'::jsonb)
      || jsonb_build_object('match_id', v_match_id)
  from jsonb_array_elements(v_participants) as p(item);

  return jsonb_build_object(
    'match_id', v_match_id,
    'status', 'COMPLETED',
    'ledger_event_id', v_event_id,
    'summary', jsonb_build_object(
      'participant_count', v_participant_count,
      'total_positive_amount', v_total_positive,
      'total_negative_amount', v_total_negative,
      'total_amount', v_total_amount
    )
  );
end;
$$;

create or replace function public.void_match(match_id uuid, reason text, session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_input_match_id uuid := $1;
  v_reason text := nullif(btrim($2), '');
  v_session_id uuid;
  v_status text;
  v_void_event_id uuid;
  v_reversal_line_count int;
begin
  v_session_id := public.verify_session($3);

  if v_reason is null then
    raise exception 'Void reason is required';
  end if;

  select m.status
  into v_status
  from public.matches m
  where m.id = v_input_match_id
  for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if v_status <> 'COMPLETED' then
    raise exception 'Only COMPLETED matches can be voided';
  end if;

  update public.matches
  set
    status = 'VOIDED',
    voided_at = now(),
    void_reason = v_reason
  where id = v_input_match_id;

  insert into public.ledger_events (
    event_type,
    match_id,
    note,
    occurred_at,
    created_by_session_id
  )
  values (
    'VOID',
    v_input_match_id,
    v_reason,
    now(),
    v_session_id
  )
  returning id into v_void_event_id;

  insert into public.ledger_lines (
    event_id,
    player_id,
    amount,
    metadata
  )
  select
    v_void_event_id,
    ll.player_id,
    -ll.amount,
    coalesce(ll.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'reversal_of_event_id', le.id,
        'reversal_of_match_id', v_input_match_id
      )
  from public.ledger_events le
  join public.ledger_lines ll on ll.event_id = le.id
  where le.match_id = v_input_match_id
    and le.event_type = 'MATCH';

  get diagnostics v_reversal_line_count = row_count;

  if v_reversal_line_count = 0 then
    raise exception 'Original MATCH ledger lines not found';
  end if;

  return jsonb_build_object(
    'match_id', v_input_match_id,
    'status', 'VOIDED',
    'ledger_event_id', v_void_event_id,
    'reversal_line_count', v_reversal_line_count
  );
end;
$$;

alter table public.configuration enable row level security;
alter table public.app_sessions enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.ledger_events enable row level security;
alter table public.ledger_lines enable row level security;

create policy players_read_policy
on public.players for select
to anon, authenticated
using (true);

create policy matches_read_policy
on public.matches for select
to anon, authenticated
using (true);

create policy match_participants_read_policy
on public.match_participants for select
to anon, authenticated
using (true);

create policy ledger_events_read_policy
on public.ledger_events for select
to anon, authenticated
using (true);

create policy ledger_lines_read_policy
on public.ledger_lines for select
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;

revoke all on table public.configuration from anon, authenticated;
revoke all on table public.app_sessions from anon, authenticated;

grant select on table public.players to anon, authenticated;
grant select on table public.matches to anon, authenticated;
grant select on table public.match_participants to anon, authenticated;
grant select on table public.ledger_events to anon, authenticated;
grant select on table public.ledger_lines to anon, authenticated;

grant select on public.v_player_balances to anon, authenticated;
grant select on public.v_match_history to anon, authenticated;
grant select on public.v_dashboard_summary to anon, authenticated;
grant select on public.v_player_stats to anon, authenticated;

grant execute on function public.check_admin_key(text) to anon, authenticated;
grant execute on function public.create_match(jsonb, text) to anon, authenticated;
grant execute on function public.void_match(uuid, text, text) to anon, authenticated;

revoke all on function public.verify_session(text) from public, anon, authenticated;
