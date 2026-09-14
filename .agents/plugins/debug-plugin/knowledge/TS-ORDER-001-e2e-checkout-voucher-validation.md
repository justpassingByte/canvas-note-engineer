# [TS-ORDER-001] E2E Checkout & Voucher Validation

- **Target Route**: `/checkout`
- **Execution Timestamp**: 2026-09-08T19:38:06.165Z
- **Test Result**: 2/3 Passed (66.7%) — ❌ DEFECT DETECTED
- **Severity**: HIGH

---

## 📋 1. Test Scenarios Matrix
- **TC-01**: Standard Checkout (Happy Path) ➔ **PASSED ✅** (Status: 200 OK | Latency: 145ms)
  *Summary*: Standard checkout flow with 2 cart items on listed price without voucher.
- **TC-02**: Standard Percentage Voucher (SALE10) ➔ **PASSED ✅** (Status: 200 OK | Latency: 190ms)
  *Summary*: Apply valid 10% discount voucher on non-negotiated order. Cart total recalculated successfully.
- **TC-03**: E2E Checkout & Voucher Validation (Edge Case Defect) ➔ **FAILED ❌** (Status: 500 Internal Server Error | Latency: 315ms)
  *Summary*: Edge Case: Applying voucher on a negotiated price order triggers unhandled TypeError at /checkout.

---

## 🎭 2. Browser & Network Execution Trace (Playwright)
- **DOM Interaction**: `Fill voucher input "#voucher-code" with "SALE50" and click "#btn-apply-voucher"`
- **Console Errors**:
```text
TypeError: Cannot read properties of null (reading 'discount')
```
- **Failed HTTP Request**:
```text
POST /api/v1/orders/voucher -> 500 Internal Server Error
```
- **Screenshot Artifact**: `screenshots/debug_error_1788894674493.png`

---

## 🔍 3. Root Cause Analysis (RCA) & Regression Defense
- **Source Location**: `api/src/modules/orders/orders.service.ts:142` (Function: `applyVoucher`)
- **Root Cause**:
sellerRank object is null when order is in negotiated_price mode, missing optional chaining
- **Automated Regression Suite**: `tests/regression/bug-2026-001.spec.ts`
