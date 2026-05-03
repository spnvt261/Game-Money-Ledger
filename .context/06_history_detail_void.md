# 06 - Match history, detail, void reversal

## History query/view

- `/matches` dùng `fetchMatchHistory()` trong `src/features/matches/matchesApi.ts`.
- Query chính đọc view `v_match_history`, sort mặc định `played_at desc`.
- Filter server-side:
  - `game_type`: `ALL | TFT | BILLIARD`.
  - `status`: `ALL | COMPLETED | VOIDED`.
  - `dateFrom`, `dateTo` map sang start/end of day rồi filter `played_at`.
- Vì `v_match_history` không có tên người chơi, API bổ sung bằng query:
  - `match_participants` theo `match_id`.
  - `players` theo `player_id`.
- Search note hoặc tên người chơi xử lý client-side trên dữ liệu đã bổ sung.
- UI:
  - Desktop table và mobile card.
  - Badge game type, status Completed/Voided.
  - Hiển thị ngày chơi, số người, tổng dương, tổng âm, note ngắn, link chi tiết.
  - Empty state "Chưa có trận nào".

## Detail query/RPC

- `/matches/:id` dùng `fetchMatchDetail()` trong `src/features/matches/matchesApi.ts`.
- Không tạo migration mới trong phase này vì schema/read policy hiện có đủ.
- Query detail đọc trực tiếp:
  - `matches` theo `id`.
  - `match_participants` theo `match_id`.
  - `ledger_events` theo `match_id`, sort `occurred_at asc`.
  - `ledger_lines` theo `event_id`.
  - `players` theo toàn bộ participant/ledger line player ids.
- Type/model chính ở `src/features/matches/matchesTypes.ts`:
  - `MatchHistoryItem`.
  - `MatchDetail`.
  - `MatchParticipantDetail`.
  - `LedgerEventDetail`.
  - `LedgerLineDetail`.
- Detail UI hiển thị:
  - Game type, status, played_at, created_at, note.
  - Void reason/voided_at nếu status `VOIDED`.
  - Tổng positive, tổng negative, net = 0.
  - Participants với placement, net amount.
  - TFT metadata: rule_code, penalty amount, top2/top8, penalty_count, base_amount, penalty_lost, winner_penalty_bonus.
  - Billiard metadata: input mode/manual amount.
  - Ledger timeline gồm MATCH event lines và VOID event lines nếu đã void.

## Void flow

- Nút chỉ hiện khi detail status là `COMPLETED`.
- Label: `Hủy trận / đảo bút toán`.
- Khi bấm mở dialog riêng:
  - Bắt nhập lý do hủy.
  - Giải thích rõ không xóa trận và không xóa participants.
  - Giải thích hệ thống tạo ledger event `VOID` với dòng đảo dấu để số dư quay lại.
- Submit gọi RPC:

```ts
supabase.rpc('void_match', {
  match_id: matchId,
  reason,
  session_token: sessionToken,
})
```

- RPC backend đảm bảo:
  - Verify session.
  - Chỉ void match `COMPLETED`.
  - Set match status `VOIDED`.
  - Insert ledger event `VOID`.
  - Insert ledger lines bằng `- original MATCH ledger lines`.
  - Không xóa match hoặc participants.
  - Một match không void 2 lần.
- Frontend disable void khi offline hoặc chưa tải được detail.
- Nếu backend trả lỗi session hết hạn, frontend logout và redirect `/login`.
- RPC errors cho void được map thêm trong `src/lib/supabaseErrors.ts`.

## Cache invalidation

- Sau create match, `NewMatchPage` invalidate thêm `queryKeys.matchHistory`.
- Sau void match thành công:
  - `queryKeys.dashboardSummary`.
  - `queryKeys.playerBalances`.
  - `queryKeys.matchHistory`.
  - `queryKeys.matchDetail(matchId)`.
  - Refetch detail ngay để reload status/ledger timeline.
- Query keys mới:
  - `matchHistory`.
  - `matchHistoryList(filters)`.
  - `matchDetails`.
  - `matchDetail(matchId)`.

## UI xử lý voided match

- `/matches` tô nền nhẹ cho row voided và dùng badge `Voided`.
- `/matches/:id` hiển thị alert "Trận đã được void".
- Detail không hiện nút void nếu status `VOIDED`.
- Ledger timeline giúp kiểm tra MATCH và VOID lines đảo dấu.
- Tổng participants vẫn hiển thị theo trận gốc; ledger section thể hiện reversal thực tế.

## Bug nghiệp vụ đã sửa

- Cập nhật `src/types/domain.ts`: `MatchStatus` từ `ACTIVE | VOIDED` thành `COMPLETED | VOIDED` để khớp DB/RPC. Không thay đổi rule TFT.

## Verification

- `npm exec --yes tsx -- src/features/matches/tftRules.test.ts`
- `npm run lint`
- `npm run build`

Ghi chú build: Vite vẫn cảnh báo chunk lớn hơn 500 kB; chưa xử lý ở phase này vì không liên quan history/detail/void.

## Phase sau cần polish

- Có thể thêm view/RPC `get_match_detail(match_id)` nếu muốn giảm số round-trip Supabase cho detail.
- Có thể thêm phân trang/infinite scroll cho `/matches` khi dữ liệu lớn.
- Có thể thêm export CSV hoặc settlement view.
- Có thể gom toast thành component dùng chung thay vì fixed toast local từng page.
