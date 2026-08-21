// Cognito authentication helpers
// TODO: Replace mock login with real Cognito SDK (e.g. aws-amplify: Auth.signIn)
//       employee_id, manager_id, and role should be sourced from Cognito custom
//       attributes / user pool groups returned by the ID token after sign-in.

export const auth = {
  /**
   * Returns the current user from localStorage, or null if no session exists.
   * In production this would decode the Cognito ID token from the session.
   */
  getUser: () => {
    const raw = localStorage.getItem("current_user");
    return raw ? JSON.parse(raw) : null;
  },

  setUser: (user) => {
    localStorage.setItem("current_user", JSON.stringify(user));
  },

  /**
   * Mock login that simulates what Cognito would return after authentication.
   * Uses the explicit `role` selection (from LoginPage) rather than heuristic
   * email inspection, mirroring how Cognito groups would determine role.
   *
   * The two test accounts below match the seeded DynamoDB data (EMP001 / MGR001).
   * In production, employee_id and manager_id come from Cognito custom attributes
   * (custom:employee_id, custom:manager_id) on the verified user record.
   */
  login: async (email, role) => {
    const mockUser =
      role === "manager"
        ? {
            employee_id: "MGR001",
            name: "Rajesh Verma",
            role: "manager",
            email,
            manager_id: null, // managers have no upward manager in this org
          }
        : {
            employee_id: "EMP001",
            name: "Priya Sharma",
            role: "employee",
            email,
            manager_id: "MGR001", // sourced from Cognito custom:manager_id in prod
          };

    localStorage.setItem("current_user", JSON.stringify(mockUser));
    localStorage.setItem("auth_token", "mock-jwt-cognito-id-token");
    return mockUser;
  },

  logout: () => {
    localStorage.removeItem("current_user");
    localStorage.removeItem("auth_token");
  },
};
