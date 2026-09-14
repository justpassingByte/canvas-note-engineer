# [BUG-2026-001] Lỗi tương tranh giải phóng tiền ký quỹ khi Huỷ đơn hàng (Order Escrow Race)

- **Thời gian phát hiện**: 2026-09-09 02:20:00
- **Môi trường**: Staging / Local Dev (API: 4201, Frontend: 4200)
- **Trạng thái**: ✅ Đã xác minh bằng Playwright & Replay Test
- **Mức độ nghiêm trọng**: CRITICAL (Rủi ro tài chính / Tiền ký quỹ)

---

## 1. Triệu chứng & Bằng chứng Thu thập từ Browser Trace (Playwright)
- **URL kiểm thử**: `http://localhost:4200/orders/ord_882910`
- **Kịch bản thao tác**: Người mua nhấn nút *"Yêu cầu huỷ đơn"* đồng thời 2 lần trong 100ms.
- **Console Errors bắt được**:
  ```text
  [Browser Console Error] 500 (Internal Server Error) on POST /api/orders/ord_882910/cancel
  Uncaught (in promise) Error: Order is already in CANCELLATION_PENDING state
  ```
- **Lỗi mạng (Network Failure)**:
  - Endpoint: `POST http://localhost:4201/api/orders/ord_882910/cancel`
  - Status: `500 Internal Server Error`
  - Response Body: `{"code": "ESCROW_DOUBLE_RELEASE_CONFLICT", "message": "Transaction aborted due to concurrent lock"}`
- **Ảnh chụp màn hình sự cố**:
  `screenshots/debug_error_1788894674493.png`

---

## 2. Truy vết Mã nguồn (Source Code Trace)
- **File bị lỗi**: `api/src/modules/orders/orders.service.ts`
- **Hàm gây lỗi**: `cancelOrderEscrow(orderId: string, userId: string)` (Dòng 184 - 215)
- **Nguyên nhân gốc (Root Cause)**:
  Thiếu khóa dòng bi quan (`SELECT ... FOR UPDATE`) khi đọc trạng thái ví ký quỹ `escrow_accounts`. Hai request huỷ đơn song song cùng đọc thấy số dư ký quỹ > 0, dẫn đến việc giải phóng tiền 2 lần vào ví người mua (Double Refund).

---

## 3. Xác minh & Sinh Regression Test
- **File Test tự động sinh ra**: `tests/regression/bug-2026-001-escrow-race.spec.ts`
- **Kết quả xác minh lại sau khi sửa (Verification)**:
  - Đã thêm `FOR UPDATE` và kiểm tra khóa Idempotency Key trong Redis.
  - Replay 10 request huỷ đơn đồng thời bằng Playwright: 1 request thành công (`200 OK`), 9 request còn lại bị chặn an toàn (`409 Conflict`), không còn lỗi 500, số dư tiền ký quỹ chính xác 100%.
