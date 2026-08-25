import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";

export function RequireAuth() {
  const { currentUser, authReady } = useAuth();
  const { loading } = useMembers();
  if (!authReady || loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}
