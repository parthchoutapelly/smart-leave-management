# System Architecture & Service Interactions

This document outlines the architectural blueprints, event pathways, and cloud service integrations for the Serverless Leave Management System.

---

## 1. High-Level Architecture Diagram

```
                 +---------------------------------------------+
                 |          Single-Page App (React)            |
                 |     Hosted on S3 Static Website Bucket      |
                 +----------------------+----------------------+
                                        | (HTTPS / Cognito Auth)
                                        v
                 +---------------------------------------------+
                 |              Amazon API Gateway             |
                 +----+-------------------+--------------------+
                      |                   |
        (POST /submit)|                   | (GET /approve, /reject)
                      v                   v
+-----------------------------+   +-----------------------------+
| submitLeaveRequest (Lambda) |   |processApprovalDecision(Lmbd)|
+--------------+--------------+   +--------------+--------------+
               |                                 |
               | Starts                          | SendTaskSuccess/Failure
               v                                 v
+---------------------------------------------------------------+
|               AWS Step Functions State Machine                |
|  - WaitForManagerApproval (TaskToken + 48h Timeout)           |
|  - EscalateToHR (on States.Timeout)                           |
|  - Multi-tier Check (num_days > 5)                            |
|  - WaitForHRApproval (TaskToken)                              |
|  - UpdateBalanceAndApprove / NotifyRejected                   |
+---------------+-------------------------------+---------------+
                |                               |
                v                               v
+-------------------------------+   +---------------------------+
|      Amazon DynamoDB          |   |  Amazon SNS / Amazon SES  |
|  - leave_requests             |   |  - Manager alerts (SNS)   |
|  - leave_balances             |   |  - Status updates (SES)   |
|  - leave_config               |   |  - HR Escalations (SES)   |
+-------------------------------+   +---------------------------+
                ^
                | (Weekly Cron)
+---------------+---------------+
| EventBridge Scheduled Rule    |
| -> weeklyBalanceRecredit Lmbd |
+-------------------------------+
```

---

## 2. AWS Services Inventory

| Service | Primary Responsibility |
| :--- | :--- |
| **Amazon S3** | Static website hosting for the React dashboard interface. |
| **Amazon Cognito** | User authentication, identity management, and JWT issuance for employees and managers. |
| **Amazon API Gateway** | REST API gateway providing authorized routes and webhook callback endpoints. |
| **AWS Lambda** | Serverless compute layer executing business validation, token resolution, and balance updates. |
| **AWS Step Functions** | Durable orchestration of multi-tier approvals, task token callbacks, and 48h SLA timeouts. |
| **Amazon DynamoDB** | Fully managed NoSQL database storing leave requests, employee balances, and policy rules. |
| **Amazon SNS** | Immediate multi-channel notification dispatch to managers for pending approvals. |
| **Amazon SES** | Transactional email generation for approval links, rejection notices, and weekly summaries. |
| **Amazon EventBridge** | Cron-based scheduler triggering weekly balance recrediting and summary digests. |
