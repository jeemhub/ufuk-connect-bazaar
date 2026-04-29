import { useAuth } from "@/auth/AuthProvider";
import Dashboard from "./Dashboard";
import SalesDashboard from "./SalesDashboard";

export default function DashboardSwitch() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Dashboard /> : <SalesDashboard />;
}
