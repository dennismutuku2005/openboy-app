import { api } from "./apiClient";

export const authService = {
  /**
   * Authenticates with Go engine, obtains JWT token, and saves session.
   */
  async login(username, password) {
    const data = await api.post("/auth/login", { username, password });
    if (data?.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("openboy_jwt", data.token);
        localStorage.setItem("openboy_user", JSON.stringify(data.user));
      }
    }
    return data;
  },

  /**
   * Registers a new operator account.
   */
  async register(username, email, password, name) {
    const data = await api.post("/auth/register", {
      username,
      email,
      password,
      name,
    });
    if (data?.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("openboy_jwt", data.token);
        localStorage.setItem("openboy_user", JSON.stringify(data.user));
      }
    }
    return data;
  },

  /**
   * Fetches current authenticated user profile using Bearer JWT.
   */
  async getMe() {
    return api.get("/auth/me");
  },

  /**
   * Updates user name or email.
   */
  async updateProfile(name, email) {
    return api.put("/auth/profile", { name, email });
  },

  /**
   * Updates account credentials.
   */
  async updatePassword(currentPassword, newPassword) {
    return api.put("/auth/password", { currentPassword, newPassword });
  },

  /**
   * Clears session tokens and redirects to login.
   */
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("openboy_jwt");
      localStorage.removeItem("openboy_user");
      window.location.href = "/login";
    }
  },

  /**
   * Retrieves stored JWT token.
   */
  getStoredToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("openboy_jwt");
  },

  /**
   * Checks if user has a stored JWT session.
   */
  isAuthenticated() {
    return Boolean(this.getStoredToken());
  },
};
