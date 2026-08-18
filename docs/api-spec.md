# API Specification

Base URL: `https://<api-id>.execute-api.<region>.amazonaws.com/prod`

---

## 1. `POST /leaves/submit`
Submits a new leave request for balance validation and workflow initiation.

### Request Body:
```json
{
  "employee_id": "EMP001",
  "leave_type": "sick",
  "start_date": "2026-08-20",
  "end_date": "2026-08-21",
  "manager_id": "MGR001",
  "reason": "Doctor appointment"
}
```

### Response (200 OK):
```json
{
  "status": "submitted",
  "request_id": "REQ-1723901234567-abcde",
  "message": "Leave request submitted successfully"
}
```

---

## 2. `GET /approve`
Processes manager or HR approval via HMAC-signed link.

### Query Parameters:
- `request_id`: ID of the leave request (e.g. `REQ-1723901234567-abcde`)
- `employee_id`: ID of the employee (e.g. `EMP001`)
- `decision`: `approved`
- `token`: HMAC-SHA256 signature

---

## 3. `GET /reject`
Processes manager or HR rejection via HMAC-signed link.

### Query Parameters:
- `request_id`: ID of the leave request
- `employee_id`: ID of the employee
- `decision`: `rejected`
- `token`: HMAC-SHA256 signature

---

## 4. `GET /balances`
Retrieves quota balances for an employee.

### Query Parameters:
- `employee_id`: `EMP001`

---

## 5. `GET /requests`
Retrieves leave history for an employee.

### Query Parameters:
- `employee_id`: `EMP001`
