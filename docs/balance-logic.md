# Leave Balance Logic & Quota Enforcement

This document explains the mathematical rules, lifecycle verification checkpoints, and storage mechanisms for employee leave quotas.

---

## 1. How Balances Are Tracked

Each employee maintains dedicated balance records in the `leave_balances` table, partitioned by `employee_id` and indexed by a composite sort key: `leave_type#YYYY` (e.g., `sick#2026`).

### Core Record Schema:
- **`total_quota`**: Base days allocated for the year (derived from `leave_config.annual_quota`).
- **`carry_forward`**: Approved leftover days carried forward from the prior annual cycle (capped by `leave_config.max_carry_forward`).
- **`used`**: Cumulative sum of approved absence days in the current cycle.
- **`remaining`**: Effective available days calculated as:
  $$\text{remaining} = (\text{total\_quota} + \text{carry\_forward}) - \text{used}$$

---

## 2. When Balances Are Checked (Submission Phase)

When an employee submits a new leave request:
1. The `submitLeaveRequest` Lambda extracts the requested date range and computes the requested duration ($N$ days).
2. It queries `leave_balances` using `{ employee_id, leave_type_year: "${leave_type}#${year}" }`.
3. **If $\text{remaining} < N$:**
   - The request is immediately rejected with reason `"insufficient balance"`.
   - A record is logged in `leave_requests` under `status: "rejected"`.
   - **No notification is sent to the manager**, preventing unnecessary inbox noise.
4. **If $\text{remaining} \ge N$:**
   - The system checks for date overlaps against existing approved leaves.
   - If clean, the request is written with `status: "submitted"` and workflow orchestration begins.

---

## 3. When Balances Are Decremented (Final Approval Phase)

Balances are updated **strictly on final approval**:
- For requests $\le 5$ days: decremented once the Manager approves.
- For requests $> 5$ days (or escalated requests): decremented once both Manager and HR approve.

> [!IMPORTANT]
> **Prevention of Double-Counting / Premature Deduction:**
> Decrementing quotas at submission would create race conditions and phantom deductions if a request is subsequently rejected or cancelled. By deferring atomic decrement operations (`SET used = used + :n, remaining = remaining - :n`) to `updateBalanceAndNotify`, the system guarantees transaction integrity.

---

## 4. Carry-Forward Automation (Weekly EventBridge Job)

An automated EventBridge rule invokes `weeklyBalanceRecredit`:
- Scans `leave_balances` for year-end transition checks.
- Evaluates `leave_config.max_carry_forward` for each category.
- Applies $\text{carry\_forward} = \min(\text{remaining}, \text{max\_carry\_forward})$.
- Dispatches employee balance digests via Amazon SES.

---

## 5. Config-Driven Design (Zero Hardcoding)

All business rules (annual quotas, carry-forward limits, HR escalation day thresholds, negative balance flags) reside in the `leave_config` DynamoDB table. HR administrators can modify corporate policies instantly without touching code or redeploying Lambda services.
