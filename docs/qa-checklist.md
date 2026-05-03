# QA Checklist - Game Money Ledger

Checklist này dùng cho phase ổn định trước deploy. Unit tests đã cover logic tiền thuần; các mục liên quan Supabase, network và UI cần kiểm tra thủ công trên môi trường local hoặc staging.

## Unit Test Bắt Buộc

Chạy:

```bash
npm run test
```

Kỳ vọng:

- `formatVnd(100000)` trả `+100` theo định dạng mặc định.
- `parseMoneyInput` parse được `50k`, `-50k`, `50,000`, `50.000`, `50000`, `50.000 ₫`.
- `calculateTftResults` trả đúng kết quả TFT 3 người và 4 người.
- `validateZeroSum` trả `true` khi tổng `netAmount = 0`, trả `false` khi lệch tổng.

## TFT 3 Người

### Case 1 - Không penalty

- Player A top 1.
- Player B top 3.
- Player C top 4.

Expected:

- A `+100`
- B `-50`
- C `-50`
- Tổng `0`

### Case 2 - Tự dính top 2/top 8

- 3 người.
- Player A top 1.
- Player B top 2.
- Player C top 8.

Expected:

- A `+120`
- B `-60`
- C `-60`
- Tổng `0`

### Case 3 - Người nhất nhóm dính top 2

- Player A top 2.
- Player B top 3.
- Player C top 8.

Expected:

- A `+110`
- B `-50`
- C `-60`
- Tổng `0`

## TFT 4 Người

### Case 1 - Không penalty

- Player A top 1.
- Player B top 3.
- Player C top 4.
- Player D top 5.

Expected:

- A `+70`
- B `+30`
- C `-50`
- D `-50`
- Tổng `0`

### Case 2 - Tự dính top 2/top 8

- 4 người.
- Player A top 1.
- Player B top 2.
- Player C top 3.
- Player D top 8.

Expected:

- A `+90`
- B `+20`
- C `-50`
- D `-60`
- Tổng `0`

## Billiard

- Player A `+50`.
- Player B `-50`.

Expected:

- Tổng `0`.
- App cho lưu khi đủ session, Supabase env và network ổn định.
- Nếu đổi B thành `-40`, app không cho lưu vì tổng lệch `+10`.

## Void

1. Tạo một match hợp lệ.
2. Ghi lại balance trước và sau khi tạo match.
3. Vào match detail.
4. Void match với lý do không rỗng.
5. Kiểm tra balance quay lại như trước khi tạo match.
6. Kiểm tra match status là `VOIDED`.
7. Kiểm tra ledger timeline có event `MATCH` và event `VOID`.
8. Kiểm tra các ledger line trong event `VOID` đảo dấu so với event `MATCH`.
9. Kiểm tra UI không còn nút void sau khi status là `VOIDED`.
10. Gọi void lần 2 phải bị chặn bởi UI hoặc RPC với lỗi chỉ cho void match `COMPLETED`.

## Network

### Mất mạng

- Tắt network trong DevTools hoặc ngắt kết nối.
- Vào Players, thử tạo/sửa player.
- Vào New Match, thử lưu TFT/Billiard.

Expected:

- Không cho lưu match/player.
- UI có thông báo mất kết nối.
- Dữ liệu đã cache có thể vẫn xem được nếu đã tải trước đó.

### Mạng yếu

- Dùng throttling trong DevTools hoặc tăng độ trễ network.

Expected:

- UI hiện cảnh báo mạng yếu.
- Các thao tác lưu bị chặn hoặc cảnh báo theo trạng thái `slow`.

### Thiếu env

- Xóa hoặc để trống `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
- Chạy lại app.

Expected:

- App không crash trắng.
- Login/settings hiển thị cấu hình Supabase còn thiếu.

## Build Và Deploy Smoke Test

Chạy:

```bash
npm run lint
npm run build
```

Sau deploy staging:

- Truy cập trực tiếp `/login`, `/dashboard`, `/matches`, `/matches/new`, `/players`, `/settings`.
- Login bằng admin key staging.
- Tạo player test.
- Tạo TFT 3 người theo case 1.
- Tạo Billiard `+50k/-50k`.
- Void một match test.
- Refresh trang detail và history để đảm bảo route SPA hoạt động.
