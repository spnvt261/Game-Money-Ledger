# 08 - QA, tests, documentation, deploy notes

## Test đã thêm

- Cài Vitest vào dev dependency.
- Cập nhật `package.json`:
  - `test`: `vitest run`
  - `typecheck`: `tsc -b`
  - Giữ các script `dev`, `build`, `preview`, `lint`.
- Chuyển `src/features/matches/tftRules.test.ts` từ assert script thủ công sang Vitest.
- Thêm `src/lib/money.test.ts`.

Coverage logic thuần hiện có:

- `formatVnd`
  - Số dương có dấu `+`.
  - Số âm có dấu `-`.
  - Số `0` và `null`.
  - `showSign: false`.
- `parseMoneyInput`
  - `50k`, `-50k`, `+100k`.
  - `50.000`, `-100,000`, `50.000 ₫`, `50.000đ`.
  - Input rỗng/chưa nhập trả `0`.
  - Ký tự lạ không làm throw.
- `calculateTftResults`
  - TFT 3 người case default:
    - A `+100.000 ₫`
    - B `-50.000 ₫`
    - C `-50.000 ₫`
    - Tổng `0`
  - TFT 3 người case B top2, C top8:
    - A `+120.000 ₫`
    - B `-60.000 ₫`
    - C `-60.000 ₫`
    - Tổng `0`
  - TFT 4 người case default:
    - A `+70.000 ₫`
    - B `+30.000 ₫`
    - C `-50.000 ₫`
    - D `-50.000 ₫`
    - Tổng `0`
  - TFT 4 người case B top2, D top8:
    - A `+90.000 ₫`
    - B `+20.000 ₫`
    - C `-50.000 ₫`
    - D `-60.000 ₫`
    - Tổng `0`
  - Duplicate placement bị reject.
- `validateZeroSum`
  - Billiard `+50.000/-50.000` pass.
  - Tổng lệch fail.

## QA checklist

- Tạo `docs/qa-checklist.md`.
- Checklist gồm:
  - Unit test bắt buộc.
  - TFT 3 người case 1/case 2.
  - TFT 4 người case 1/case 2.
  - Billiard zero-sum.
  - Void flow:
    - Tạo match.
    - Balance thay đổi.
    - Void match.
    - Balance quay lại.
    - Match status `VOIDED`.
    - Có ledger event `VOID`.
    - Ledger lines đảo dấu.
    - Không void lần 2.
  - Network:
    - Offline không cho lưu match/player và có thông báo.
    - Slow network có cảnh báo.
    - Thiếu env không crash trắng.
  - Smoke test sau deploy staging.

## README đã cập nhật

`README.md` hiện là tài liệu tiếng Việt đầy đủ hơn, gồm:

- Giới thiệu Game Money Ledger.
- App dùng để quản lý ledger tiền thắng/thua TFT và Billiard.
- Tech stack.
- Cấu trúc thư mục.
- Cách chạy local:
  - `npm install`
  - `npm run dev`
- Cách cấu hình `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_NAME`
  - `VITE_SESSION_STORAGE_KEY`
  - `VITE_NETWORK_PING_INTERVAL_MS`
  - `VITE_NETWORK_SLOW_TIMEOUT_MS`
- Cách setup Supabase:
  - chạy migration.
  - bật `pgcrypto` nếu cần.
  - tạo `admin_key_hash`.
  - seed players tùy chọn.
- Luồng nghiệp vụ:
  - Login admin key.
  - Players.
  - Tạo TFT.
  - Tạo Billiard.
  - History/detail.
  - Void.
- Deploy Cloudflare Pages và Vercel.
- Lưu ý bảo mật phase đầu.
- Roadmap:
  - settlement.
  - group fund.
  - report/export.

## Hướng deploy

- Cloudflare Pages:
  - Build command: `npm run build`.
  - Output directory: `dist`.
  - Khai báo các biến `VITE_*`.
  - Thêm `public/_redirects` với `/* /index.html 200` để refresh route SPA không 404.
- Vercel:
  - Framework preset: Vite.
  - Build command: `npm run build`.
  - Output directory: `dist`.
  - Khai báo các biến `VITE_*`.
  - Kiểm tra truy cập trực tiếp các route protected sau deploy.

## Kết quả verification

- `npm run test`
  - Pass.
  - 2 test files.
  - 13 tests.
- `npm run lint`
  - Pass.
- `npm run typecheck`
  - Pass.
- `npm run build`
  - Pass.
  - Vite vẫn warning chunk JS lớn hơn 500 kB.

## Giới hạn còn lại

- Chưa thêm UI/integration test nặng; phase này chỉ test logic thuần và checklist thủ công.
- Void/network/env cần kiểm tra trên browser thật hoặc staging Supabase để xác nhận đầy đủ end-to-end.
- Bundle production vẫn có warning chunk lớn; nên code-split route hoặc tách manual chunks ở phase tối ưu riêng.
- Security phase đầu vẫn chưa dùng Supabase Auth; session token vẫn nằm trong `localStorage` theo thiết kế hiện tại.
