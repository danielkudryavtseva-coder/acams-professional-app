import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireExec() {
  const { isExec } = useAuth();
  if (!isExec) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
