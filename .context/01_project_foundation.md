# 01 - Project foundation

## Cau truc da tao

- Khoi tao frontend SPA Vite + React + TypeScript tai root `D:\Projects\TFT3`.
- Tao cac thu muc chinh:
  - `src/app`
  - `src/components`
  - `src/components/layout`
  - `src/components/ui`
  - `src/features/auth`
  - `src/features/dashboard`
  - `src/features/matches`
  - `src/features/players`
  - `src/features/settings`
  - `src/lib`
  - `src/routes`
  - `src/types`
  - `src/styles`
  - `supabase/migrations`
  - `.context`
- Da doc `TFT_Money_App_Huong_Thiet_Ke.txt` va trich noi dung workbook `TFT_Money_App_Huong_Thiet_Ke.xlsx`.

## Package da dung

- Core: `vite`, `react`, `react-dom`, `typescript`.
- UI: `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`, `lucide-react`, `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-label`.
- Routing/data/form: `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`.
- Backend-lite client: `@supabase/supabase-js`.
- Utility: `clsx`, `tailwind-merge`, `date-fns`.

## Routes da co

- `/login`
- `/dashboard`
- `/matches`
- `/matches/new`
- `/matches/:id`
- `/players`
- `/settings`
- fallback `404`

## Component/layout chinh

- `AppShell`: desktop sidebar, mobile bottom navigation, sticky header, main content container.
- `PageHeader`
- `StatCard`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `NetworkStatusBadge`
- `MoneyText`
- shadcn-style UI primitives: `Button`, `Badge`, `Card`, `Input`, `Label`, `Table`, `Skeleton`, `Alert`.

## Env keys da them

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=Game Money Ledger
VITE_SESSION_STORAGE_KEY=game_money_ledger_session
VITE_NETWORK_PING_INTERVAL_MS=15000
VITE_NETWORK_SLOW_TIMEOUT_MS=5000
```

Khong hardcode Supabase URL/key that.

## Network status

- Da tao `useNetworkStatus`.
- Theo doi `navigator.onLine`.
- Co ping dinh ky theo `VITE_NETWORK_PING_INTERVAL_MS`.
- Co timeout cham theo `VITE_NETWORK_SLOW_TIMEOUT_MS`.
- Trang thai hien tai:
  - `online` -> `Co mang`
  - `offline` -> `Mat mang`
  - `slow` -> `Mang yeu`
  - `checking` -> `Dang kiem tra`

## Quyet dinh ky thuat

- Product name la `Game Money Ledger`; khong dat app la TFT.
- Su dung Supabase client wrapper nhung cho phep `supabase = null` khi chua cau hinh env.
- Phase nay chi lam frontend foundation va skeleton logic, chua tao backend rieng.
- Chua dung Supabase Auth email/password.
- Route app chinh dung `AppShell`; `/login` la man hinh rieng.
- UI dung Tailwind CSS v4 voi Vite plugin va shadcn-style components trong `src/components/ui`.
- Type domain dung camelCase o frontend, giu du nghiep vu core: `GameType`, `Player`, `Match`, `MatchParticipant`, `LedgerEvent`, `LedgerLine`.

## Can tiep tuc phase sau

- Tao Supabase migrations cho schema core.
- Tao RPC `check_admin_key`, `create_match`, `void_match`.
- Implement session manager luu `session_token` theo `VITE_SESSION_STORAGE_KEY`.
- Implement Players CRUD.
- Implement calculator TFT 3/4 nguoi va validator Billiard manual input.
- Noi dashboard/history/detail voi Supabase views.
- Them test cho calculator va form validation.
