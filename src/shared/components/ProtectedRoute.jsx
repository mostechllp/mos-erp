import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Loader from "../../admin/components/common/Loader";
import { DEMO_MODE, getStoredRoleId } from "../../erp/demoSession";
import { getRole, canOpenPath } from "../../erp/roles";

const ProtectedRoute = ({ requiredType, children }) => {
  const { isAuthenticated, userType, loading } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ERP demo: a role can only open the pages its sidebar exposes.
  if (DEMO_MODE) {
    const role = getRole(getStoredRoleId());
    const path = location.pathname;
    const home = role.home;
    if (
      (path.startsWith("/admin") || path.startsWith("/employee")) &&
      path !== home &&
      !canOpenPath(role, path)
    ) {
      toast.error(`${role.label} does not have access to that page`, { id: "route-denied" });
      return <Navigate to={home} replace />;
    }
  }

  // Admin users
  if (userType === "admin") {
    // Admin trying to access employee route
    if (requiredType && requiredType !== "admin") {
      return <Navigate to="/admin/home" replace />;
    }

    return children || <Outlet />;
  }

  // Employee-side users
  const employeeTypes = ["employee", "hr", "manager", "team_lead"];

  if (employeeTypes.includes(userType)) {
    // Employee-side user trying to access admin route
    if (requiredType === "admin") {
      const currentPath = location.pathname;

      if (currentPath.startsWith("/admin")) {
        const rewrittenPath = currentPath.replace("/admin", "/employee");
        return <Navigate to={rewrittenPath} replace />;
      }

      return <Navigate to="/employee/home" replace />;
    }

    return children || <Outlet />;
  }

  // Unknown/unsupported user type
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;