# 05 - Create match flow: TFT, Billiard, preview, validation

## Rule TFT đã implement

- File rule chính: `src/features/matches/tftRules.ts`.
- Constants:
  - `TFT_PENALTY_AMOUNT = 10000`.
  - `TFT_RULE_CODE_3P = "TFT_DEFAULT_3P_V1"`.
  - `TFT_RULE_CODE_4P = "TFT_DEFAULT_4P_V1"`.
- Functions:
  - `getTftBaseAmount(participantCount, placement)`.
  - `getTftRuleCode(participantCount)`.
  - `calculateTftResults(input)`.
  - `validateZeroSum(participants)`.
  - `sumNetAmount(participants)`.
- Rule base:
  - TFT 3 người: hạng 1 `+100000`, hạng 2 `-50000`, hạng 3 `-50000`.
  - TFT 4 người: hạng 1 `+70000`, hạng 2 `+30000`, hạng 3 `-50000`, hạng 4 `-50000`.
- Penalty:
  - Mỗi checkbox `top2` hoặc `top8` là 1 penalty `-10000`.
  - Người hạng 1 nhận bonus tổng số penalty của cả trận `* 10000`.
  - Người hạng 1 vẫn bị trừ penalty của chính mình nếu có tick.
- Test đơn giản: `src/features/matches/tftRules.test.ts`.

## Payload gửi RPC

- API wrapper: `src/features/matches/matchesApi.ts`.
- Type payload: `src/features/matches/matchesTypes.ts`.
- Lưu trận gọi:

```ts
supabase.rpc('create_match', {
  payload,
  session_token: sessionToken,
})
```

### TFT

```json
{
  "game_type": "TFT",
  "played_at": "ISO datetime",
  "note": "optional or null",
  "metadata": {
    "participant_count": 4,
    "rule_code": "TFT_DEFAULT_4P_V1",
    "penalty_amount": 10000
  },
  "participants": [
    {
      "player_id": "...",
      "placement": 1,
      "net_amount": 90000,
      "metadata": {
        "top2": true,
        "top8": false,
        "penalty_count": 1,
        "base_amount": 70000,
        "penalty_lost": -10000,
        "winner_penalty_bonus": 30000
      }
    }
  ]
}
```

### BILLIARD

```json
{
  "game_type": "BILLIARD",
  "played_at": "ISO datetime",
  "note": "optional or null",
  "metadata": {
    "input_mode": "manual_net_amount"
  },
  "participants": [
    {
      "player_id": "...",
      "placement": null,
      "net_amount": 50000,
      "metadata": {}
    }
  ]
}
```

## Validation đã làm

- Player picker chỉ dùng active players từ `fetchPlayers()`.
- Không cho chọn trùng player bằng disabled option và vẫn validate lại trước khi lưu.
- TFT:
  - Chỉ cho chọn 3 hoặc 4 người.
  - Placement nằm trong `1..participant_count`.
  - Placement không được trùng.
  - Thiếu player hoặc placement thì không tạo payload.
  - Tổng `net_amount` phải bằng 0 qua `validateZeroSum`.
- Billiard:
  - Ít nhất 2 người chơi.
  - Không trùng player.
  - `net_amount` parse được các dạng `50k`, `-50k`, `50.000`, `50000`.
  - Tổng `net_amount` phải bằng 0.
- Nút `Lưu trận` disabled khi:
  - Không có session token hoặc session hết hạn.
  - Network `offline`, `checking`, hoặc `slow`.
  - Danh sách player đang load hoặc lỗi load.
  - Thiếu player, trùng player, trùng placement TFT.
  - Tổng tiền khác 0.
  - Chưa tạo được payload hợp lệ.
- RPC error được map thêm trong `src/lib/supabaseErrors.ts` cho các lỗi create_match phổ biến.

## UI flow `/matches/new`

- File: `src/features/matches/NewMatchPage.tsx`.
- Gồm 4 section:
  1. Chọn game: card selector TFT/Billiard, thời gian chơi, ghi chú.
  2. Chọn người chơi: slot picker theo game type.
  3. Nhập kết quả: hiển thị rule/input mode và tổng tiền.
  4. Preview & lưu: người nhận tiền ở trên, người mất tiền ở dưới.
- TFT UI:
  - Toggle số người 3/4.
  - Mỗi slot chọn player, placement, checkbox `Dính top 2`, `Dính top 8`.
  - Preview tự tính base, penalty, bonus.
- Billiard UI:
  - Dynamic participant slots, tối thiểu 2.
  - Nhập net amount thủ công.
  - Quick amount buttons: `+50k`, `-50k`, `+100k`, `-100k`.
- Lưu:
  - Có `window.confirm` trước khi gọi RPC.
  - Thành công hiện toast nhỏ, invalidate balance/dashboard, redirect `/matches/:id` nếu RPC trả `match_id`, fallback `/matches`.

## Edge cases đã xử lý

- Player hạng 1 TFT bị tick penalty: vừa bị trừ penalty_lost, vừa nhận tổng bonus penalty của cả trận.
- Nhiều penalty ở nhiều người vẫn zero-sum.
- TFT không đủ player hoặc placement không tạo preview lưu được.
- Billiard có số tiền nhập dạng shorthand `k` hoặc có dấu phân tách hàng nghìn.
- Net amount 0 vẫn preview được nhưng tổng toàn trận vẫn phải bằng 0.
- Không có active player thì hiển thị empty state và link sang quản lý người chơi.
- RPC trả lỗi session, duplicate, inactive player, placement hoặc tổng tiền được dịch sang tiếng Việt.

## Verification

- `npm exec --yes tsx -- src/features/matches/tftRules.test.ts`
- `npm run lint`
- `npm run build`

Ghi chú build: Vite vẫn có warning chunk lớn hơn 500 kB, chưa xử lý ở phase này vì không liên quan nghiệp vụ tạo trận.

## Phase sau: history/detail

- Implement `/matches` đọc `v_match_history` thật.
- Implement `/matches/:id` đọc `matches`, `match_participants`, player info và metadata.
- Hiển thị breakdown metadata của TFT trong detail.
- Sau khi create match redirect sang detail sẽ có dữ liệu thật khi detail page được nối Supabase.
- Thêm void action thật ở detail bằng RPC `void_match`.
