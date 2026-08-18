# Edge Case Analysis & Handling Report

This document records the edge cases, business anomalies, and security protections implemented in the Serverless Leave Management System.

---

## 1. Insufficient Balance at Submission
- **Scenario:** Employee applies for 4 days of sick leave when only 2 days remain in `leave_balances`.
- **Handling:** Auto-rejected synchronously by `submitLeaveRequest` Lambda before notifying managers or initiating Step Functions executions.
- **Verification:** Verified via API test case. Returns HTTP 200 with `{ status: "rejected", reason: "insufficient balance" }`.

---

## 2. Overlapping Date Ranges
- **Scenario:** Employee attempts to book a leave for `2026-08-20` to `2026-08-22` while an approved leave already exists for `2026-08-21` to `2026-08-25`.
- **Handling:** Lambda queries DynamoDB for existing requests with `status IN ('manager_approved', 'hr_approved', 'approved')` and evaluates `startA <= endB && startB <= endA`. Overlaps trigger automatic rejection with reason `"overlapping leave dates"`.
- **Verification:** Second request rejected immediately; no notification generated.

---

## 3. Manager Inaction Beyond 48 Hours (Auto-Escalation)
- **Scenario:** A manager is out-of-office or fails to review a submitted request within the 48-hour SLA.
- **Handling:** Handled natively via AWS Step Functions task token wait state using `TimeoutSeconds: 172800` (48 hours) and a `Catch` block matching `States.Timeout`.
- **Workflow Action:** The state machine transitions automatically to `EscalateToHR`, which invokes `notifyHREscalation` to dispatch an urgent notification to the HR administrator with an escalated subject line and direct approval links.
- **Verification:** Tested in staging with a 120-second timeout to confirm automated path transition and email dispatch.

---

## 4. Multi-Tier Approval (> 5 Days Threshold)
- **Scenario:** An employee submits a 6-day earned leave request.
- **Handling:** Step Functions Choice rule checks `$.num_days > 5`. Upon manager approval, the workflow routes to `WaitForHRApproval` rather than finalizing.
- **Workflow Action:** Requires secondary approval from the central HR administrator before calling `updateBalanceAndNotify`.

---

## 5. Tampered or Replayed Approval Link Tokens
- **Scenario:** An unauthorized actor attempts to tamper with URL query parameters (e.g. altering `decision` or `request_id`) or forge an approval action.
- **Handling:** Each action link contains an HMAC SHA-256 signature generated with a secure secret key:
  $$\text{HMAC-SHA256}(\text{request\_id} + ":" + \text{decision}, \text{SECRET})$$
  `processApprovalDecision` validates the signature before checking DynamoDB or resuming Step Functions.
- **Verification:** Tampered query parameters return HTTP 403 Forbidden with security alert message.

---

## 6. Known Simplifications & Architecture Trade-offs
1. **IAM Policy Scope:** Uses AWS managed policies (`PowerUserAccess` / `AmazonDynamoDBFullAccess`) during rapid sprint prototyping; least-privilege resource-scoped IAM policies are planned for production hardening.
2. **Amazon SES Sandbox:** Standard sandbox mode requires test recipient email verification prior to sending.
3. **DynamoDB Filter Expressions:** Querying with client-side/filter expression checks for date overlap is optimal for team-scale workloads; high-scale enterprise deployments would introduce a GSI on date ranges.
