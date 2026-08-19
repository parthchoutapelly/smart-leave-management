# DynamoDB Schema Definitions

This document details the schema design, keys, indexes, and sample item shapes for all DynamoDB tables used in the Serverless Leave Management System.

---

## 1. `leave_requests`

Stores all leave applications submitted by employees across their entire lifecycle.

### Key Schema
- **Partition Key (PK):** `employee_id` (String) - e.g., `"EMP001"`
- **Sort Key (SK):** `request_id` (String) - e.g., `"REQ-1723901234567"`

### Item Attributes
| Attribute | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `employee_id` | String | Employee identifier (PK) | `"EMP001"` |
| `request_id` | String | Unique leave request identifier (SK) | `"REQ-1723901234567"` |
| `leave_type` | String | Type of leave (`sick`, `casual`, `earned`, `unpaid`) | `"sick"` |
| `start_date` | String | Start date of leave (YYYY-MM-DD) | `"2026-08-20"` |
| `end_date` | String | End date of leave (YYYY-MM-DD) | `"2026-08-22"` |
| `num_days` | Number | Total days requested | `3` |
| `status` | String | Current workflow status (`submitted`, `approved`, `rejected`) | `"submitted"` |
| `manager_id` | String | Reporting manager identifier | `"MGR001"` |
| `reason` | String | Stated reason for leave | `"Doctor appointment & recovery"` |
| `rejection_reason` | String | Reason if rejected (optional) | `"insufficient balance"` |
| `sfn_task_token` | String | Step Functions Task Token for callback | `"AAAA...=="` |
| `created_at` | String | ISO 8601 Timestamp of submission | `"2026-08-18T10:00:00.000Z"` |
| `updated_at` | String | ISO 8601 Timestamp of last update | `"2026-08-18T10:00:00.000Z"` |

---

## 2. `leave_balances`

Tracks remaining leave quotas per employee, per leave type, for a given year.

### Key Schema
- **Partition Key (PK):** `employee_id` (String) - e.g., `"EMP001"`
- **Sort Key (SK):** `leave_type_year` (String) - e.g., `"sick#2026"`

### Item Attributes
| Attribute | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `employee_id` | String | Employee identifier (PK) | `"EMP001"` |
| `leave_type_year` | String | Composite sort key: `{leave_type}#{year}` (SK) | `"sick#2026"` |
| `leave_type` | String | Type of leave | `"sick"` |
| `year` | Number | Calendar year | `2026` |
| `total_quota` | Number | Annual allocated quota | `12` |
| `used` | Number | Number of days consumed | `3` |
| `remaining` | Number | Number of days remaining (`total_quota + carry_forward - used`) | `9` |
| `carry_forward` | Number | Days carried forward from previous cycle | `0` |
| `updated_at` | String | ISO 8601 Timestamp of last update | `"2026-08-18T10:00:00.000Z"` |

---

## 3. `leave_config`

Central configuration table defining organizational leave rules without hardcoding values in backend code.

### Key Schema
- **Partition Key (PK):** `leave_type` (String) - e.g., `"sick"`, `"casual"`, `"earned"`, `"unpaid"`

### Item Attributes
| Attribute | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `leave_type` | String | Unique leave type identifier (PK) | `"sick"` |
| `annual_quota` | Number | Standard days allocated annually | `12` |
| `max_carry_forward` | Number | Maximum days eligible for carry-forward | `5` |
| `requires_hr_above_days` | Number | Threshold where HR approval is required | `5` |
| `allow_negative_balance` | Boolean | Whether negative balance is permitted | `false` |
| `description` | String | Description of the policy | `"Medical and health related leaves"` |
