# 04 - Players CRUD, dashboard, money display

## Backend / RPC

- Tao migration: `supabase/migrations/0002_player_write_rpcs.sql`.
- Players CRUD ghi du lieu qua RPC, khong ghi truc tiep bang Supabase table write.
- RPC moi:
  - `create_player(display_name, slug, avatar_url, is_active, session_token)`.
  - `update_player(player_id, display_name, slug, avatar_url, is_active, session_token)`.
- Ca hai RPC goi `verify_session(session_token)` truoc khi ghi.
- `create_player` trim name/slug/avatar, slug lowercase, validate slug dang `a-z`, `0-9`, `-`, va tao row trong `players`.
- `update_player` trim/validate tuong tu va cap nhat `display_name`, `slug`, `avatar_url`, `is_active`.
- Deactivate/restore dung `update_player`, khong xoa cung player.

## Query keys va data fetching

- Tao `src/lib/queryKeys.ts`:
  - `players`
  - `playerBalances`
  - `dashboardSummary`
- API players:
  - `fetchPlayers()` doc table `players`.
  - `fetchPlayerBalances()` doc view `v_player_balances`.
  - `createPlayer()` goi RPC `create_player`.
  - `updatePlayer()` goi RPC `update_player`.
- Sau mutation player invalidate:
  - `players`
  - `playerBalances`
  - `dashboardSummary`
- API dashboard:
  - `fetchDashboardSummary()` doc view `v_dashboard_summary`.
- Dashboard doc:
  - `v_dashboard_summary` cho stat cards.
  - `v_player_balances` cho bang so du, top dang loi, top dang lo.
- Chua can dung `v_player_stats` trong phase nay vi `v_player_balances` da du cho balance/top.

## Players UI/UX

- `PlayersPage` da thay placeholder bang UI that:
  - Header "Nguoi choi".
  - Nut "Them nguoi choi".
  - Search theo ten hoac slug.
  - Filter: dang hoat dong, da an, tat ca.
  - Desktop table co avatar/initial, ten, slug, trang thai, so du hien tai, tong tran, action sua/an/khoi phuc.
  - Mobile card list de bam.
  - Empty state khi chua co player va khi filter khong co ket qua.
- Form them/sua dung dialog/sheet responsive.
- Validate bang zod:
  - `displayName` bat buoc.
  - `slug` bat buoc, dung lowercase/number/hyphen.
  - `avatarUrl` optional nhung neu co phai la URL http/https.
- Slug tu sinh tu display name khi tao moi, nguoi dung co the sua.
- Submit va action ghi disabled khi offline.
- Loi query/mutation hien thi bang tieng Viet.

## Dashboard UI/UX

- `DashboardPage` da doc du lieu Supabase thay placeholder.
- Stat cards:
  - Tong nguoi choi.
  - Nguoi choi dang hoat dong.
  - Tong tran da ghi.
  - Tong tien da luan chuyen.
- Bang/card so du tung nguoi:
  - So du duong co dau `+` va badge "Duong".
  - So du am co dau `-` va badge "Am".
  - So du 0 co badge "Can bang".
  - So tien can phai trong desktop table.
- Section:
  - "Top dang loi".
  - "Top dang lo".
  - "Link nhanh": tao tran moi, xem lich su, quan ly nguoi choi.
- Loading skeleton rieng cho dashboard.
- Empty state huong dan: them nguoi choi truoc, sau do tao tran.
- Offline:
  - Neu da co cache trong TanStack Query, dashboard van hien thi du lieu da tai.
  - Neu offline va khong co cache, hien huong dan kiem tra mang/tai lai.

## Money display

- Cap nhat `formatVnd()` trong `src/lib/money.ts`.
- `MoneyText` dung `formatVnd()` thong nhat.
- So duong mac dinh hien `+70.000 ₫`.
- So am hien `-50.000 ₫`.
- So 0 hien `0 ₫`.
- Khong hien chu `VND`.
- UI khong chi phu thuoc mau: balance co them label/badge Duong/Am/Can bang.

## Reuse cho phase tao tran

- Dung lai `queryKeys.players` va `queryKeys.playerBalances` cho player picker.
- Dung lai `fetchPlayers()` de lay danh sach active players khi tao tran.
- Dung lai `PlayerAvatar` cho picker/list participants.
- Dung lai `MoneyText` / `formatVnd()` cho preview ledger va net amount.
- Khi luu tran, tiep tuc check `useAuth().session?.sessionToken` va `useNetworkStatus().canWrite`.
- Cac nut save/mutation nen disabled khi offline nhu PlayersPage.
