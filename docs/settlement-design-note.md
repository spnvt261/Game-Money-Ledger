# Settlement Design Note

Phase này chưa implement settlement RPC hoặc UI. Lý do: settlement đụng trực tiếp vào dấu ledger và có thể làm sai số dư nếu đưa vào quá sớm. App core hiện đã ổn cho players, tạo match, history/detail, void; settlement nên được thêm sau khi có môi trường staging để test end-to-end với dữ liệu thật.

## Model Hiện Tại

Convention của ledger:

- `ledger_lines.amount > 0`: người chơi được nhận/lãi, balance tăng.
- `ledger_lines.amount < 0`: người chơi mất/nợ, balance giảm.
- `v_player_balances.balance_amount` được tính từ tổng `ledger_lines.amount`.
- Match và void đều là zero-sum.

Ví dụ sau một match:

- A `-50.000 ₫`: A đang nợ hoặc đã thua 50.000.
- B `+50.000 ₫`: B đang được nhận 50.000.

## Định Nghĩa Settlement Đề Xuất

Settlement là hành động ghi nhận thanh toán ngoài đời:

> Người A trả tiền cho người B để giảm công nợ đang tồn tại.

Payload đề xuất:

```json
{
  "from_player_id": "uuid-nguoi-tra",
  "to_player_id": "uuid-nguoi-nhan",
  "amount": 50000,
  "note": "A trả B"
}
```

Tên field:

- `from_player_id`: người trả tiền ngoài đời.
- `to_player_id`: người nhận tiền ngoài đời.
- `amount`: số tiền dương, đơn vị VND.
- `note`: ghi chú tùy chọn, nhưng UI nên khuyến khích nhập.

## Dấu Ledger Cho Settlement

Khi A trả B `50.000 ₫`:

- A đã trả bớt nợ, nên balance của A cần tăng lên: `+50.000`.
- B đã nhận bớt khoản phải nhận, nên balance của B cần giảm xuống: `-50.000`.

Ledger lines đề xuất:

```txt
from_player_id: +amount
to_player_id:   -amount
total:          0
```

Ví dụ:

Trước settlement:

```txt
A balance = -50.000
B balance = +50.000
```

A trả B `50.000`:

```txt
A ledger line = +50.000
B ledger line = -50.000
```

Sau settlement:

```txt
A balance = 0
B balance = 0
```

Cảnh báo quan trọng: không được hiểu `from_player_id` là người bị trừ ledger. Trong model hiện tại, người trả tiền để giảm nợ phải được cộng balance.

## RPC Đề Xuất Cho Phase Sau

Schema hiện đã cho phép `ledger_events.event_type = 'SETTLEMENT'`, nên phase sau chỉ cần migration RPC, không cần đổi enum/check constraint.

Tên RPC:

```sql
create_settlement(payload jsonb, session_token text)
```

Validation bắt buộc:

- Verify session bằng `verify_session(session_token)`.
- `payload` là JSON object.
- `from_player_id` là UUID hợp lệ.
- `to_player_id` là UUID hợp lệ.
- `from_player_id <> to_player_id`.
- Hai player tồn tại và nên là `is_active = true`.
- `amount` là integer dương.
- `note` trim, optional hoặc bắt buộc tùy UX.

Insert đề xuất:

```txt
ledger_events:
  event_type = SETTLEMENT
  match_id = null
  note = note
  occurred_at = now()
  created_by_session_id = session_id

ledger_lines:
  from_player_id: +amount
  to_player_id: -amount
```

Return JSON đề xuất:

```json
{
  "ledger_event_id": "...",
  "event_type": "SETTLEMENT",
  "from_player_id": "...",
  "to_player_id": "...",
  "amount": 50000,
  "summary": {
    "total_amount": 0
  }
}
```

## Cảnh Báo Backend

Trigger `assert_ledger_event_balanced` hiện chỉ enforce zero-sum cho event có `match_id` khác `null`. Settlement event dự kiến có `match_id = null`, nên phase sau phải làm một trong hai cách:

1. Enforce zero-sum trực tiếp trong RPC `create_settlement`.
2. Hoặc mở rộng trigger để enforce zero-sum cho `event_type in ('MATCH', 'VOID', 'SETTLEMENT')`.

Khuyến nghị: làm cả hai nếu implement thật. RPC kiểm tra sớm để lỗi rõ ràng; trigger giữ invariant ở tầng database.

## UI Đề Xuất Cho Phase Sau

Nếu thêm UI, làm thật nhỏ trong Settings hoặc Dashboard:

- Title: `Ghi nhận thanh toán ngoài đời`.
- Chọn người trả.
- Chọn người nhận.
- Nhập số tiền.
- Nhập ghi chú.
- Preview rõ:
  - Người trả: `+amount` vào ledger vì đã trả bớt nợ.
  - Người nhận: `-amount` vào ledger vì đã nhận bớt tiền phải nhận.
- Confirm trước khi lưu.
- Disable khi offline/slow/checking giống create match.
- Sau lưu invalidate:
  - `queryKeys.playerBalances`
  - `queryKeys.dashboardSummary`

Không thêm trong phase đầu:

- Group Fund.
- Debt period.
- Tự động đề xuất ai trả ai.
- Export/report settlement.
- Settlement history page riêng.

## Test Case Cho Phase Sau

### Case 1 - Trả hết nợ

Trạng thái ban đầu:

- A `-50.000`
- B `+50.000`

Settlement:

- A trả B `50.000`

Expected:

- Ledger line A `+50.000`
- Ledger line B `-50.000`
- Tổng event `0`
- Balance A `0`
- Balance B `0`

### Case 2 - Trả một phần

Trạng thái ban đầu:

- A `-120.000`
- B `+120.000`

Settlement:

- A trả B `50.000`

Expected:

- Balance A `-70.000`
- Balance B `+70.000`
- Tổng event `0`

### Case 3 - Validate lỗi

Expected:

- `amount <= 0` bị chặn.
- `from_player_id = to_player_id` bị chặn.
- Player không tồn tại bị chặn.
- Thiếu session hoặc session hết hạn bị chặn.
- Offline không cho submit từ UI.

## Kết Luận Phase 09

Phase 09 chỉ ghi design note. Chưa implement RPC/UI để tránh overbuild và tránh rủi ro đảo sai dấu ledger. Foundation thực tế đã có một phần trong schema vì `SETTLEMENT` đã là event type hợp lệ; phase sau có thể thêm RPC nhỏ dựa trên note này.
