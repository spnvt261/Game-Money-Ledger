set search_path = public, extensions;

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
      or placement > 8;

    if v_invalid_count > 0 then
      raise exception 'TFT participants require placement from 1 to 8';
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

grant execute on function public.create_match(jsonb, text) to anon, authenticated;
