// API client for AWS API Gateway endpoints

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://api.example.com/prod";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("auth_token") || "";
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const leaveApi = {
  // Returns { balances: [...] }  — items have employee_id, leave_type_year, remaining, used, total_quota
  getBalances: (employeeId) => request(`/balances?employee_id=${employeeId}`),

  // Returns { requests: [...] }  — items have request_id, leave_type, start_date, end_date, num_days, status, reason
  getRequests: (employeeId) => request(`/requests?employee_id=${employeeId}`),

  // Returns { status, request_id, message } on success (status="submitted")
  // Returns { status, request_id, reason, remaining_balance?, requested_days? } on balance/overlap rejection
  submitLeave: (payload) =>
    request("/leaves/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // TODO: confirm actual API Gateway route for the getPendingApprovals Lambda before deploying
  // Returns { pending: [...] }
  getPendingApprovals: (managerId) => request(`/manager/pending?manager_id=${managerId}`),

  // TODO: confirm actual API Gateway route for the getApprovedLeaveForTeam Lambda before deploying
  // Returns { approved_leaves: [...] }
  getApprovedLeaves: () => request("/calendar/approved"),
};
