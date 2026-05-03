# Game Money Ledger

Game Money Ledger là ứng dụng nội bộ để ghi nhận tiền thắng/thua sau các ván game, hiện hỗ trợ TFT và Billiard. Mục tiêu chính là giữ một ledger zero-sum rõ ràng: người thắng có số tiền dương, người thua có số tiền âm, tổng mỗi trận luôn bằng `0`.

Ứng dụng phù hợp cho nhóm chơi cố định cần quản lý người chơi, tạo trận, xem lịch sử, kiểm tra chi tiết bút toán và void trận sai bằng bút toán đảo chiều thay vì xóa dữ liệu.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS v4 và component UI kiểu shadcn
- React Router
- TanStack Query
- React Hook Form + Zod
- Supabase client, PostgreSQL, RPC, RLS
- Vitest cho unit test logic thuần

## Cấu Trúc Thư Mục

```txt
src/
  app/                  App root và providers
  components/           Layout, UI primitives, shared components
  features/
    auth/               Admin key login và session storage
    dashboard/          Tổng quan số dư, người chơi, tiền luân chuyển
    matches/            Tạo trận, history, detail, TFT rules, match API
    players/            Players CRUD qua RPC
    settings/           Trạng thái app/env/network/session/rule
  lib/                  Supabase client, env, money utils, query keys
  routes/               Router và trang 404
  styles/               Global CSS
  types/                Domain và Supabase database types
supabase/
  migrations/           Schema, views, RPC
  seed.sql              Helper tạo admin_key_hash
docs/
  qa-checklist.md       Checklist QA nghiệp vụ và deploy
.context/               Ghi chú từng phase phát triển
```

## Chạy Local

Yêu cầu: Node.js LTS và npm.

```bash
npm install
npm run dev
```

Các script chính:

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run typecheck
```

## Cấu Hình `.env`

Tạo file `.env` hoặc `.env.local` từ `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=Game Money Ledger
VITE_SESSION_STORAGE_KEY=game_money_ledger_session
VITE_NETWORK_PING_INTERVAL_MS=15000
VITE_NETWORK_SLOW_TIMEOUT_MS=5000
```

Ý nghĩa:

- `VITE_SUPABASE_URL`: URL project Supabase.
- `VITE_SUPABASE_ANON_KEY`: anon public key của Supabase.
- `VITE_APP_NAME`: tên hiển thị trong UI.
- `VITE_SESSION_STORAGE_KEY`: key lưu session admin trong `localStorage`.
- `VITE_NETWORK_PING_INTERVAL_MS`: chu kỳ kiểm tra network.
- `VITE_NETWORK_SLOW_TIMEOUT_MS`: timeout để đánh dấu mạng yếu.

Nếu thiếu Supabase env, app hiển thị cảnh báo cấu hình thay vì crash trắng.

## Setup Supabase

1. Tạo project Supabase.
2. Chạy migration trong `supabase/migrations` theo thứ tự:

```bash
supabase db push
```

Hoặc copy SQL trong dashboard Supabase nếu chưa dùng Supabase CLI.

3. Migration `0001_initial_schema.sql` sẽ bật `pgcrypto`:

```sql
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
```

Nếu môi trường Supabase yêu cầu bật extension thủ công, bật `pgcrypto` trước khi chạy phần còn lại.

4. Tạo `admin_key_hash`:

```sql
select crypt('CHANGE_ME_ADMIN_KEY', gen_salt('bf'));
```

Lưu hash vào bảng `configuration`:

```sql
insert into public.configuration (key, value)
values (
  'admin_key_hash',
  jsonb_build_object('hash', crypt('CHANGE_ME_ADMIN_KEY', gen_salt('bf')))
)
on conflict (key) do update
set value = excluded.value;
```

5. Seed players nếu muốn:

```sql
insert into public.players (display_name, slug)
values
  ('Player A', 'player-a'),
  ('Player B', 'player-b'),
  ('Player C', 'player-c'),
  ('Player D', 'player-d')
on conflict (slug) do nothing;
```

## Luồng Nghiệp Vụ

- Login bằng admin key: frontend gọi RPC `check_admin_key`, nhận `session_token` và lưu vào `localStorage`.
- Players: tạo, sửa, ẩn/khôi phục người chơi qua RPC `create_player` và `update_player`.
- Tạo TFT: chọn 3 hoặc 4 người, nhập hạng, tick penalty top2/top8, app tự tính kết quả zero-sum.
- Tạo Billiard: nhập tiền thủ công từng người, app chỉ cho lưu khi tổng bằng `0`.
- History/detail: xem danh sách trận, trạng thái, người chơi, tổng tiền và timeline ledger.
- Void: chỉ void trận `COMPLETED`; hệ thống đổi status sang `VOIDED`, tạo ledger event `VOID` và bút toán đảo dấu để balance quay lại.

## Deploy

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: khai báo toàn bộ biến `VITE_*` như phần `.env`.
- Sau khi deploy, kiểm tra route fallback cho SPA. Nếu cần, thêm file `_redirects` trong `public` với nội dung:

```txt
/* /index.html 200
```

### Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: khai báo toàn bộ biến `VITE_*` trong Project Settings.
- Vercel tự xử lý SPA fallback cho Vite trong hầu hết trường hợp; vẫn nên kiểm tra truy cập trực tiếp `/dashboard`, `/matches`, `/players`.

## Lưu Ý Bảo Mật Phase Đầu

- Chưa dùng Supabase Auth email/password.
- Admin key được kiểm tra qua RPC `check_admin_key`; database chỉ lưu hash, không lưu raw key.
- Frontend giữ raw `session_token` trong `localStorage`.
- Các write flow chính đi qua RPC có `verify_session`; không mở insert/update/delete trực tiếp cho ledger.
- Không commit `.env` thật, admin key thật hoặc anon key của project production vào repo public.

## QA

Checklist nghiệp vụ nằm ở `docs/qa-checklist.md`.

Unit test hiện cover:

- `formatVnd`
- `parseMoneyInput`
- `calculateTftResults`
- `validateZeroSum`

Chạy:

```bash
npm run test
npm run lint
npm run build
```

## Roadmap

- Settlement: chốt công nợ và tạo giao dịch thanh toán.
- Group fund: quỹ nhóm, thu/chi ngoài trận.
- Report/export: báo cáo theo người chơi, thời gian, game type; xuất CSV/Excel.
