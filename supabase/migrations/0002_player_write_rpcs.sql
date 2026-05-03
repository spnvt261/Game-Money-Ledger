set search_path = public, extensions;

create or replace function public.create_player(
  display_name text,
  slug text,
  avatar_url text,
  is_active boolean,
  session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session_id uuid;
  v_display_name text := nullif(btrim($1), '');
  v_slug text := nullif(lower(btrim($2)), '');
  v_avatar_url text := nullif(btrim($3), '');
  v_is_active boolean := coalesce($4, true);
  v_player_id uuid;
begin
  v_session_id := public.verify_session($5);

  if v_display_name is null then
    raise exception 'Display name is required';
  end if;

  if v_slug is null then
    raise exception 'Slug is required';
  end if;

  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Slug must use lowercase letters, numbers, and hyphens';
  end if;

  insert into public.players (
    display_name,
    slug,
    avatar_url,
    is_active
  )
  values (
    v_display_name,
    v_slug,
    v_avatar_url,
    v_is_active
  )
  returning id into v_player_id;

  return jsonb_build_object(
    'player_id', v_player_id,
    'display_name', v_display_name,
    'slug', v_slug,
    'avatar_url', v_avatar_url,
    'is_active', v_is_active,
    'created_by_session_id', v_session_id
  );
end;
$$;

create or replace function public.update_player(
  player_id uuid,
  display_name text,
  slug text,
  avatar_url text,
  is_active boolean,
  session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_input_player_id uuid := $1;
  v_session_id uuid;
  v_display_name text := nullif(btrim($2), '');
  v_slug text := nullif(lower(btrim($3)), '');
  v_avatar_url text := nullif(btrim($4), '');
  v_is_active boolean := coalesce($5, true);
  v_updated_player public.players%rowtype;
begin
  v_session_id := public.verify_session($6);

  if v_display_name is null then
    raise exception 'Display name is required';
  end if;

  if v_slug is null then
    raise exception 'Slug is required';
  end if;

  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Slug must use lowercase letters, numbers, and hyphens';
  end if;

  update public.players
  set
    display_name = v_display_name,
    slug = v_slug,
    avatar_url = v_avatar_url,
    is_active = v_is_active
  where id = v_input_player_id
  returning * into v_updated_player;

  if not found then
    raise exception 'Player not found';
  end if;

  return jsonb_build_object(
    'player_id', v_updated_player.id,
    'display_name', v_updated_player.display_name,
    'slug', v_updated_player.slug,
    'avatar_url', v_updated_player.avatar_url,
    'is_active', v_updated_player.is_active,
    'updated_by_session_id', v_session_id
  );
end;
$$;

grant execute on function public.create_player(text, text, text, boolean, text) to anon, authenticated;
grant execute on function public.update_player(uuid, text, text, text, boolean, text) to anon, authenticated;
