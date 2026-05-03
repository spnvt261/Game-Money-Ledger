# 02 - Supabase schema, ledger, RPC

## Migration da tao

- Tao migration: `supabase/migrations/0001_initial_schema.sql`.
- Tao helper seed/comment: `supabase/seed.sql`.
- Bat `pgcrypto` de dung `gen_random_uuid()`, `gen_random_bytes()`, `crypt()`, `gen_salt()`.

## Schema chinh

Bang core:

- `configuration`
  - Luu config dang JSONB.
  - `admin_key_hash` duoc luu tai row `key = 'admin_key_hash'`.
- `app_sessions`
  - Luu `token_hash`, `role`, `expires_at`.
  - Frontend chi giu raw `session_token`.
- `players`
  - `display_name`, `slug`, `avatar_url`, `is_active`.
- `matches`
  - `game_type` check `TFT | BILLIARD`.
  - `status` check `COMPLETED | VOIDED`.
  - Co `created_by_session_id`, `voided_at`, `void_reason`.
- `match_participants`
  - Unique `(match_id, player_id)`.
  - `net_amount > 0` la duoc nhan/lai.
  - `net_amount < 0` la mat/no.
- `ledger_events`
  - `event_type` check `MATCH | VOID | SETTLEMENT | ADJUSTMENT`.
- `ledger_lines`
  - Ledger source of truth.
  - `amount > 0` la duoc nhan/lai.
  - `amount < 0` la mat/no.

Indexes da tao theo yeu cau:

- `players(is_active)`
- `matches(played_at desc)`
- `matches(game_type)`
- `matches(status)`
- `match_participants(match_id)`
- `match_participants(player_id)`
- `ledger_events(match_id)`
- `ledger_lines(player_id)`

Index bo sung:

- `app_sessions(expires_at)`
- `ledger_events(event_type)`
- `ledger_lines(event_id)`

## Ledger balance guard

- Tao deferred constraint trigger `assert_ledger_event_balanced`.
- Ap dung cho `ledger_events` va `ledger_lines`.
- Voi moi event co `match_id`, tong `ledger_lines.amount` cua event phai bang `0`.
- Trigger la `deferrable initially deferred` de RPC co the insert event truoc, insert lines sau trong cung transaction.

## Views

Da tao 4 view:

- `v_player_balances`
  - `player_id`
  - `display_name`
  - `avatar_url`
  - `is_active`
  - `balance_amount`
  - `match_count`
- `v_match_history`
  - `match_id`
  - `game_type`
  - `status`
  - `played_at`
  - `note`
  - `participant_count`
  - `total_positive_amount`
  - `total_negative_amount`
- `v_dashboard_summary`
  - `total_players`
  - `active_players`
  - `total_matches`
  - `total_completed_matches`
  - `total_voided_matches`
  - `total_money_moved`
- `v_player_stats`
  - `player_id`
  - `display_name`
  - `total_matches`
  - `total_win_amount`
  - `total_loss_amount`
  - `balance_amount`

Ghi chu:

- `balance_amount` doc tu `ledger_lines`, bao gom reversal khi void.
- `match_count`, match stats va `total_money_moved` chi tinh match `COMPLETED`.
- `total_negative_amount` va `total_loss_amount` la so am theo convention ledger.

## RPC da tao

### `check_admin_key(input_key text)`

- Doc `configuration.key = 'admin_key_hash'`.
- Ho tro value dang:
  - `{"hash": "..."}`.
  - JSON string `"..."`.
- So sanh bang `crypt(input_key, admin_key_hash) = admin_key_hash`.
- Neu dung:
  - Tao raw token bang `encode(gen_random_bytes(32), 'hex')`.
  - Luu `crypt(session_token, gen_salt('bf'))` vao `app_sessions.token_hash`.
  - Set `expires_at = now() + interval '30 days'`.
  - Tra ve `session_token`, `role`, `expires_at`.
- Neu sai hoac chua cau hinh hash: raise exception ro rang.

### `verify_session(session_token text)`

- Helper `security definer`.
- Tim `app_sessions` chua het han bang `crypt(session_token, token_hash) = token_hash`.
- Tra `session_id`.
- Da revoke execute voi `public`, `anon`, `authenticated`; chi dung noi bo trong RPC khac.

### `create_match(payload jsonb, session_token text)`

- Verify session truoc.
- Validate:
  - payload la JSON object.
  - `game_type` la `TFT` hoac `BILLIARD`.
  - `metadata` la JSON object.
  - `participants` la array va co it nhat 2 nguoi.
  - Moi participant co `player_id` uuid, `net_amount` integer, `metadata` object neu co.
  - Khong duplicate player.
  - Player phai ton tai va `is_active = true`.
  - Tong `net_amount = 0`.
  - TFT bat buoc 3 hoac 4 participants, placement tu 1..N va khong trung.
- Ghi trong mot transaction cua Postgres function:
  - `matches`
  - `match_participants`
  - `ledger_events` type `MATCH`
  - `ledger_lines` amount = `net_amount`
- Return JSON co `match_id`, `status`, `ledger_event_id`, `summary`.

Payload chuan:

```json
{
  "game_type": "TFT",
  "played_at": "2026-05-03T10:00:00.000Z",
  "note": "optional note",
  "metadata": {
    "participant_count": 4,
    "rule_code": "TFT_4P_DEFAULT",
    "penalty_amount": 10000
  },
  "participants": [
    {
      "player_id": "00000000-0000-0000-0000-000000000000",
      "placement": 1,
      "net_amount": 70000,
      "metadata": {}
    },
    {
      "player_id": "11111111-1111-1111-1111-111111111111",
      "placement": 2,
      "net_amount": 30000,
      "metadata": {}
    },
    {
      "player_id": "22222222-2222-2222-2222-222222222222",
      "placement": 3,
      "net_amount": -50000,
      "metadata": {}
    },
    {
      "player_id": "33333333-3333-3333-3333-333333333333",
      "placement": 4,
      "net_amount": -50000,
      "metadata": {}
    }
  ]
}
```

### `void_match(match_id uuid, reason text, session_token text)`

- Verify session truoc.
- Lock match bang `for update`.
- Chi cho void match `status = COMPLETED`.
- Require `reason` khong rong.
- Update `matches.status = VOIDED`, set `voided_at`, `void_reason`.
- Tao `ledger_events` type `VOID`.
- Tao `ledger_lines` reversal bang `- original MATCH ledger lines`.
- Khong xoa du lieu goc.
- Return JSON co `match_id`, `status`, `ledger_event_id`, `reversal_line_count`.

## Admin key hash

Khong luu raw admin key.

Tao hash:

```sql
select crypt('CHANGE_ME_ADMIN_KEY', gen_salt('bf'));
```

Luu vao configuration:

```sql
insert into public.configuration (key, value)
values (
  'admin_key_hash',
  jsonb_build_object('hash', crypt('CHANGE_ME_ADMIN_KEY', gen_salt('bf')))
)
on conflict (key) do update
set value = excluded.value;
```

## Security/RLS

- Da enable RLS cho tat ca bang core.
- `configuration` va `app_sessions` khong co read policy cho anon/authenticated.
- Read policy cho:
  - `players`
  - `matches`
  - `match_participants`
  - `ledger_events`
  - `ledger_lines`
- Khong tao policy insert/update/delete truc tiep cho cac bang quan trong.
- Grant execute cho RPC public:
  - `check_admin_key`
  - `create_match`
  - `void_match`
- Revoke execute truc tiep voi `verify_session`.
- Views dung `security_invoker = true` va duoc grant select cho anon/authenticated.

Ghi chu cho phase sau:

- Players CRUD hien chua co RPC rieng va direct write dang bi chan.
- Neu UI can tao/sua/an player, nen them RPC rieng hoac policy co verify session.
- Frontend write flow tao/void match phai goi RPC, khong insert/update/delete bang ledger truc tiep.

## TypeScript da them

- Tao `src/lib/supabaseClient.ts`.
  - Doc `VITE_SUPABASE_URL`.
  - Doc `VITE_SUPABASE_ANON_KEY`.
  - Export `supabase`, `isSupabaseConfigured`, `supabaseConfig`.
  - Neu thieu env, `supabase = null`.
- Giu `src/lib/supabase.ts` de re-export, tranh pha import cu.
- Tao `src/types/database.ts` toi thieu cho tables/views/RPC.
- `src/app/App.tsx` hien warning than thien khi thieu env de app khong crash trang.

## Can tich hop UI phase sau

- Login page goi `supabase.rpc('check_admin_key', { input_key })`, luu `session_token` theo `VITE_SESSION_STORAGE_KEY`.
- Match create page goi `supabase.rpc('create_match', { payload, session_token })`.
- Match detail void action goi `supabase.rpc('void_match', { match_id, reason, session_token })`.
- Dashboard/history/detail doc views:
  - `v_dashboard_summary`
  - `v_player_balances`
  - `v_match_history`
  - `v_player_stats`
- Them Players write RPC/policy truoc khi lam Players CRUD that.
