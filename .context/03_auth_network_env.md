# 03 - Admin key auth, session storage, env, network UX

## Auth flow da tich hop

- `/login` la man hinh nhap admin key.
- Frontend goi Supabase RPC:

```ts
supabase.rpc('check_admin_key', { input_key })
```

- Neu RPC dung, frontend nhan:
  - `session_token`
  - `role`
  - `expires_at`
- Frontend chuyen thanh session object:

```ts
{
  sessionToken: string,
  role: 'admin',
  expiresAt: string
}
```

- Luu raw `sessionToken` vao `localStorage`.
- Khong doc truc tiep `configuration.admin_key_hash`.
- Khong dung Supabase Auth email/password.
- Khong co register flow.

## File auth chinh

- `src/features/auth/authTypes.ts`
  - Dinh nghia `AdminSession` va response row tu RPC.
- `src/features/auth/authStorage.ts`
  - Doc/ghi/xoa session trong `localStorage`.
  - Validate session shape.
  - Tu xoa session neu het han hoac JSON loi.
- `src/features/auth/authApi.ts`
  - Goi RPC `check_admin_key`.
  - Map ket qua Supabase sang `AdminSession`.
- `src/features/auth/AuthProvider.tsx`
  - `AuthProvider`.
  - `login(adminKey)`.
  - `logout()`.
  - Dong bo logout/login giua tabs bang storage event.
  - Kiem tra session het han dinh ky moi 60 giay.
- `src/features/auth/useAuth.ts`
  - `useAuth()`.
- `src/features/auth/authContext.ts`
  - React context dung chung cho provider va hook.
- `src/features/auth/RequireAuth.tsx`
  - Guard route protected.
  - Session rong hoac het han se redirect ve `/login`.

## Session storage

- Key lay tu:
  - `VITE_SESSION_STORAGE_KEY`
  - fallback `game_money_ledger_session`
- File cau hinh: `src/lib/env.ts`.
- Raw token chi ton tai o frontend localStorage.
- DB chi luu `app_sessions.token_hash`.

## Route guard

- `src/routes/router.tsx` boc tat ca route trong `/` bang:

```tsx
<RequireAuth>
  <AppShell />
</RequireAuth>
```

- `/login` la public route duy nhat.
- Neu chua co session hop le:
  - Redirect `/login`.
  - Luu path cu trong router state `from`.
- Neu login thanh cong:
  - Dieu huong ve `from` neu co.
  - Neu vao thang `/login` khi da co session, vao `/dashboard`.

## Header/logout

- `src/components/layout/AppShell.tsx` hien:
  - Badge `Admin`.
  - Thoi han session trong sidebar.
  - Nut `Logout`.
- Logout xoa localStorage va navigate ve `/login`.

## Login UI

- `src/features/auth/LoginPage.tsx` da thay placeholder bang flow that.
- Co ten app `Game Money Ledger`.
- Subtitle: quan ly tien thang/thua cho TFT va Billiard.
- Input admin key co show/hide password.
- Button co loading `Dang kiem tra`.
- Loi key sai/network/env duoc hien bang alert tieng Viet.
- Neu thieu Supabase env, hien card cau hinh thieu thay vi submit form.
- Neu offline, disable nut dang nhap.
- Neu slow, hien canh bao thao tac co the cham.

## Network status

- `src/lib/useNetworkStatus.ts`
  - Theo doi `navigator.onLine`.
  - Ping nhe bang `HEAD` toi app origin.
  - Interval lay tu `VITE_NETWORK_PING_INTERVAL_MS`.
  - Timeout lay tu `VITE_NETWORK_SLOW_TIMEOUT_MS`.
  - Neu browser offline, khong goi ping.
  - Neu env Supabase thieu, network check van khong crash va khong phu thuoc Supabase.
  - Return them:
    - `isOnline`
    - `isOffline`
    - `isSlow`
    - `canWrite`

## Network UX

- `src/components/NetworkBanner.tsx`
  - Offline banner:
    - "Dang mat ket noi. Ban van co the xem du lieu da tai, nhung chua the luu thay doi."
  - Slow banner:
    - "Mang dang yeu, thao tac luu co the cham."
- `src/components/NetworkStatusBadge.tsx`
  - Online chi hien badge nho.
  - Offline/slow co badge ro hon.
- Khong dung toast lap lai, nen khong spam nguoi dung.

## React Query

- `src/app/providers.tsx`
  - `refetchOnWindowFocus: false`.
  - Query retry toi da 1 lan va khong retry loi 4xx.
  - Mutation `retry: false`.
  - `networkMode: 'online'` cho query/mutation.
- `AuthProvider` duoc boc trong `QueryClientProvider`.

## Supabase error helper

- `src/lib/supabaseErrors.ts`
  - Tao `handleSupabaseError`.
  - Dich loi ky thuat sang message tieng Viet than thien.
  - Khong hien stack trace cho nguoi dung cuoi.

## Env keys lien quan

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SESSION_STORAGE_KEY=game_money_ledger_session
VITE_NETWORK_PING_INTERVAL_MS=15000
VITE_NETWORK_SLOW_TIMEOUT_MS=5000
```

## Phase sau can dung

- Moi write RPC can lay token tu `useAuth().session?.sessionToken`.
- Tao tran:

```ts
supabase.rpc('create_match', {
  payload,
  session_token: session.sessionToken,
})
```

- Void tran:

```ts
supabase.rpc('void_match', {
  match_id,
  reason,
  session_token: session.sessionToken,
})
```

- Players CRUD hien chua co RPC/policy write rieng; can bo sung truoc khi lam form tao/sua/an player that.
- Cac nut save/mutation phase sau nen check `useNetworkStatus().canWrite` truoc khi goi RPC.
