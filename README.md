# Serverless Leave Management System

A multi-tier, event-driven serverless leave management and approval automation platform built on AWS. The system handles employee leave submissions, real-time balance calculations, automated multi-tier approval escalations via AWS Step Functions, and transactional notifications using Amazon SNS & SES.

---

## 🏛️ Architecture Overview

```
[ React UI (S3) ] ──(Cognito Auth)──> [ API Gateway ]
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             [ submitLeaveRequest ]               [ processApprovalDecision ]
                        │                                     │
                        ▼                                     ▼
        [ DynamoDB: leave_requests ]              [ Step Functions Callback ]
        [ DynamoDB: leave_balances ]                          │
                        │                                     ▼
                        ▼                     [ updateBalanceAndNotify / notifyRejected ]
        [ Step Functions Workflow ]                           │
          ├─ WaitForManagerApproval (48h SLA)                 ▼
          ├─ EscalateToHR (on Timeout)             [ Amazon SES / Amazon SNS ]
          ├─ Multi-tier Check (>5 days)
          └─ WaitForHRApproval
```

---

## 📁 Repository Structure

```
.
├── README.md                                 # Master project overview & quickstart
├── .gitignore
├── phase0-aws-account-team-setup.md          # Team AWS setup guide
├── phase1-design-data-foundation.md          # Schema & data foundation guide
├── phase2-core-backend-logic.md              # Core Lambda & Step Functions guide
├── phase3-business-rules-automation.md       # Validation & EventBridge automation
├── phase4-frontend.md                        # S3 & Cognito frontend architecture
├── phase5-integration-testing.md             # E2E test plan & edge-case test cases
├── phase6-deliverables-documentation.md      # Deliverable specifications
│
├── dynamodb/
│   ├── schema.md                             # Complete DynamoDB table schemas
│   └── seed-data.json                        # Seed configurations & sample records
│
├── step-functions/
│   └── leave-approval-state-machine.json     # ASL workflow definition (48h timeout & multi-tier)
│
├── lambda/
│   ├── package.json                          # Backend SDK dependencies
│   ├── submitLeaveRequest/index.js           # Leave submission & pre-validation
│   ├── processApprovalDecision/index.js      # HMAC token validation & Step Functions callback
│   ├── updateBalanceAndNotify/index.js       # Atomic quota deduction & approval SES email
│   ├── weeklyBalanceRecredit/index.js        # EventBridge carry-forward audit & summary
│   ├── notifyManagerWithToken/index.js       # TaskToken registration & SNS link dispatch
│   ├── notifyHRWithToken/index.js            # >5-day secondary HR approval notification
│   ├── notifyHREscalation/index.js           # 48h manager timeout auto-escalation to HR
│   ├── notifyRejected/index.js               # Rejection status updater & notification
│   ├── getEmployeeBalances/index.js          # Balance query API
│   ├── getEmployeeRequests/index.js          # Leave history API
│   ├── getPendingApprovals/index.js          # Manager pending tasks API
│   └── getApprovedLeaveForTeam/index.js      # Absence calendar API
│
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js                          # Application entry point
│       ├── App.jsx                           # Primary router & state coordinator
│       ├── index.css                         # Dark-mode glassmorphic design system
│       ├── api.js                            # API Gateway client
│       ├── auth.js                           # Cognito auth adapter
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── BalanceCard.jsx
│       │   ├── ApplyForm.jsx
│       │   ├── HistoryTable.jsx
│       │   ├── PendingApprovals.jsx
│       │   └── TeamCalendar.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           ├── EmployeeDashboard.jsx
│           └── ManagerDashboard.jsx
│
├── docs/
│   ├── architecture.md                       # Deep architectural breakdown & service map
│   ├── balance-logic.md                      # Mathematical quota enforcement documentation
│   ├── edge-case-report.md                   # Edge case handling, SLAs, & security reports
│   └── api-spec.md                           # Comprehensive REST API specifications
│
└── demo/
    ├── README.md
    └── screenshots/
        └── .gitkeep
```

---

## ⚡ Core Technical Features

1. **Config-Driven Architecture:** Leave quotas, rules, and escalation thresholds live in the `leave_config` DynamoDB table—zero code changes needed to adjust organizational policies.
2. **Double-Counting Prevention:** Quotas are decremented atomically **only upon final approval**, preventing phantom deductions on rejected or cancelled requests.
3. **48-Hour Inaction Auto-Escalation:** Built natively into AWS Step Functions via task tokens and `States.Timeout` catching—automatically escalating stalled approvals to HR.
4. **Multi-Tier Approvals:** Requests exceeding 5 days dynamically branch to require both Manager and HR approval before balances update.
5. **Secure Action Links:** Manager approval links use HMAC-SHA256 signatures with server-side validation to prevent token replay and tampering.
6. **Automated Weekly Audits:** EventBridge cron jobs trigger balance summaries and carry-forward capping.
