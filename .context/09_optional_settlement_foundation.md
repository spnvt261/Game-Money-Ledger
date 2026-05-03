# 09 - Optional settlement foundation

## Quyết định phase này

- Chỉ thêm design note, chưa implement settlement RPC hoặc UI.
- File mới: `docs/settlement-design-note.md`.
- Không tạo migration mới.
- Không sửa UI core.
- Không làm Group Fund.

## Lý do chưa code settlement

- App core đã ổn và `npm run test` pass, nhưng settlement đụng trực tiếp vào dấu ledger.
- Nếu đảo sai dấu, balance sẽ sai theo hướng rất khó phát hiện khi có dữ liệu thật.
- Schema hiện đã có `ledger_events.event_type = 'SETTLEMENT'`, nên chưa cần thay đổi database vội.
- `assert_ledger_event_balanced` hiện chỉ enforce zero-sum cho event có `match_id`; settlement dự kiến `match_id = null`, nên cần thiết kế kỹ trigger/RPC ở phase sau.

## Cảnh báo dấu ledger

Convention hiện tại:

- `amount > 0`: người chơi được nhận/lãi, balance tăng.
- `amount < 0`: người chơi mất/nợ, balance giảm.

Settlement đề xuất:

- A trả B ngoài đời `amount`.
- A là `from_player_id`, B là `to_player_id`.
- Ledger line của A phải là `+amount` vì A trả bớt nợ nên balance tăng.
- Ledger line của B phải là `-amount` vì B đã nhận bớt khoản phải nhận nên balance giảm.
- Tổng event phải bằng `0`.

Ví dụ:

- Trước: A `-50.000`, B `+50.000`.
- Settlement: A trả B `50.000`.
- Lines: A `+50.000`, B `-50.000`.
- Sau: A `0`, B `0`.

## Proposal cho phase sau

RPC đề xuất:

```sql
create_settlement(payload jsonb, session_token text)
```

Payload:

```json
{
  "from_player_id": "...",
  "to_player_id": "...",
  "amount": 50000,
  "note": "A trả B"
}
```

Validation:

- Verify session.
- `amount > 0`.
- `from_player_id <> to_player_id`.
- Hai player tồn tại và active.
- Payload là JSON object hợp lệ.
- Tổng ledger lines bằng `0`.

UI đề xuất:

- Một card nhỏ trong Dashboard hoặc Settings: `Ghi nhận thanh toán ngoài đời`.
- Chọn người trả, người nhận, số tiền, ghi chú.
- Preview rõ:
  - Người trả: `+amount`.
  - Người nhận: `-amount`.
- Confirm trước khi lưu.
- Disable nếu offline/slow/checking.

## Việc cần làm phase sau

- Thêm migration RPC `create_settlement`.
- Cân nhắc mở rộng trigger balance guard cho `event_type = 'SETTLEMENT'`.
- Cập nhật TypeScript database/RPC types nếu cần.
- Thêm API wrapper frontend nếu có UI.
- Thêm unit/integration test cho sign convention settlement.
- QA trên staging:
  - trả hết nợ.
  - trả một phần.
  - amount không hợp lệ.
  - from/to trùng.
  - session hết hạn.
  - offline không submit.

## Verification

- `npm run test` pass trước khi thêm docs.
- Không chạy build/typecheck sau thay đổi vì phase này chỉ thêm documentation/context, không sửa code runtime.
