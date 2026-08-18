// Cognito / Mock authentication helpers

export const auth = {
  getUser: () => {
    const raw = localStorage.getItem("current_user");
    return raw ? JSON.parse(raw) : { employee_id: "EMP001", name: "Priya Sharma", role: "employee" };
  },
  setUser: (user) => {
    localStorage.setItem("current_user", JSON.stringify(user));
  },
  login: async (email, password) => {
    // For demo/intern purposes, mock credentials or connect to Cognito User Pool
    const mockUser = email.includes("manager")
      ? { employee_id: "MGR001", name: "Rajesh Verma", role: "manager", email }
      : { employee_id: "EMP001", name: "Priya Sharma", role: "employee", email };
    
    localStorage.setItem("current_user", JSON.stringify(mockUser));
    localStorage.setItem("auth_token", "mock-jwt-cognito-id-token");
    return mockUser;
  },
  logout: () => {
    localStorage.removeItem("current_user");
    localStorage.removeItem("auth_token");
  }
};
