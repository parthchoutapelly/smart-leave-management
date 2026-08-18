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
  getBalances: (employeeId) => request(`/balances?employee_id=${employeeId}`),
  getRequests: (employeeId) => request(`/requests?employee_id=${employeeId}`),
  submitLeave: (payload) =>
    request("/leaves/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPendingApprovals: (managerId) => request(`/manager/pending?manager_id=${managerId}`),
  getApprovedLeaves: () => request("/calendar/approved"),
};
