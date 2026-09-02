import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";

export function RequireAuth() {
  const { currentUser, authReady } = useAuth();
  const { loading } = useMembers();
  const location = useLocation();
  if (!authReady || loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.approvalStatus !== "approved" && location.pathname !== "/account-status") {
    return <Navigate to="/account-status" replace />;
  }
  return <Outlet />;
}
