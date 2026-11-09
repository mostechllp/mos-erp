import { getRole, DEFAULT_ROLE_ID } from "./roles";

// Demo mode is ON unless explicitly disabled:  VITE_DEMO_MODE=false
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

export const ROLE_KEY = "erp-demo-role";

// A well-formed (unsigned) JWT that never expires, so apiClient's expiry logic stays quiet.
const fakeJwt = () => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "demo", exp: 4102444800 })}.demo`;
};

export const getStoredRoleId = () => localStorage.getItem(ROLE_KEY) || DEFAULT_ROLE_ID;

// Writes the same localStorage keys the real login flow writes (authSlice.loginUser).
export const writeSession = (roleId) => {
  const role = getRole(roleId);
  const token = fakeJwt();
  const user = role.user;

  ["hr-token", "hr-user", "employee-token", "employee-user"].forEach((k) => localStorage.removeItem(k));
  localStorage.setItem("auth-token", token);
  localStorage.setItem("user-type", user.type);
  localStorage.setItem("user-data", JSON.stringify(user));
  if (user.type === "admin") {
    localStorage.setItem("hr-token", token);
    localStorage.setItem("hr-user", JSON.stringify(user));
  } else {
    localStorage.setItem("employee-token", token);
    localStorage.setItem("employee-user", JSON.stringify(user));
  }
  localStorage.setItem(ROLE_KEY, role.id);
  return { role, token, user };
};
