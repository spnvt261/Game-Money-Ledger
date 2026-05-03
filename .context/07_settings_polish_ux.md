# 07 - Settings, responsive UI, UX polish

## Settings đã hiển thị

- File chính: `src/features/settings/SettingsPage.tsx`.
- Thông tin ứng dụng:
  - Tên app từ `appConfig.appName`.
  - Version từ `VITE_APP_VERSION`, fallback `0.0.0`.
- Supabase:
  - Badge `Đã cấu hình` hoặc `Thiếu env`.
  - Hiển thị env key còn thiếu từ `supabaseConfig.missingKeys`.
- Network:
  - Dùng `NetworkStatusBadge`.
  - Có nút `Kiểm tra lại` gọi `useNetworkStatus().checkNow()`.
- Session:
  - Hiển thị đang đăng nhập admin.
  - Hiển thị hạn session theo `vi-VN`.
  - Nút đăng xuất có confirm.
- Tiền:
  - Đơn vị VND.
  - Mẫu `+70.000 ₫`, `-50.000 ₫`, `0 ₫`.
- Rule readonly:
  - TFT 3 người: nhất +100k, hai/ba -50k, penalty top2/top8.
  - TFT 4 người: nhất +70k, nhì +30k, ba/bốn -50k, penalty như rule đã chốt.
  - Billiard: nhập tiền thủ công, tổng bằng 0.
- Không thêm màn quản lý rule và không đổi rule TFT.

## Polish UI/UX đã làm

- `MoneyText` có `variant`: `auto`, `positive`, `negative`, `neutral`.
- `PlayerAvatar` fallback initials có nhiều tone màu nhẹ thay vì một màu cố định.
- `AppShell`:
  - Đổi nhãn logout sang `Đăng xuất`.
  - Logout có confirm.
  - Subtitle sidebar đổi sang tiếng Việt.
- `NetworkBanner` giảm padding dọc để không chiếm quá nhiều không gian.
- PageHeader eyebrow chuyển sang tiếng Việt ở Dashboard, Players, Matches, New Match, Match Detail, Settings.
- Status badge trên history/detail đổi từ `Completed/Voided` sang `Đã ghi/Đã hủy`.
- Một số nhãn form trong `/matches/new` đổi sang tiếng Việt:
  - `Player` -> `Người chơi`.
  - `Net amount` -> `Số tiền`.
  - `Preview` -> `Bảng xem trước`.
- Global radius đổi về `0.5rem` để card/button/input nhất quán và gọn hơn.
- Background root giảm sắc ấm để UI không bị ngả beige.

## Mobile/responsive đã kiểm tra

- `/matches/new`:
  - Thêm sticky save bar trên mobile, nằm phía trên bottom nav.
  - Hiển thị tổng tiền và nút `Lưu trận` rõ ràng.
  - Giữ padding bottom để nội dung cuối không bị che.
  - Player picker, placement và money input vẫn dùng layout một cột trên mobile.
- `/matches`:
  - Đã có mobile card thay table.
- `/matches/:id`:
  - Participants có mobile card, ledger table vẫn nằm trong container scroll ngang khi cần.
- `/settings`:
  - Các card dùng grid responsive, tự chuyển một cột trên mobile.

## Refactor quan trọng

- `src/lib/env.ts` thêm `appVersion`.
- `src/components/MoneyText.tsx` thêm variant, giữ backward compatibility.
- `src/components/PlayerAvatar.tsx` thêm tone fallback theo tên.
- Không refactor lớn các page dài để tránh làm lệch nghiệp vụ trong phase polish.

## Verification

- `npm run lint`
- `npm run build`
- `npm exec --yes tsx -- src/features/matches/tftRules.test.ts`

Ghi chú build: Vite vẫn cảnh báo chunk lớn hơn 500 kB; chưa xử lý vì cần phase tối ưu bundle riêng.

## Issue còn lại cho QA phase

- Nên kiểm tra thủ công trên trình duyệt thật ở iPhone/Android viewport trước release.
- Có thể gom toast local thành component dùng chung.
- Có thể thêm focus trap đầy đủ cho dialog tự dựng nếu cần mức accessibility cao hơn.
- Có thể code-split route để giảm warning chunk lớn.
