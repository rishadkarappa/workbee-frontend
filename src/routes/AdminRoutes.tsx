import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

//Pages
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLayout from "@/layout/AdminLayout";
import Users from "@/pages/admin/UserManagement";
import WorkerManagement from "@/pages/admin/WorkerManagement";
import NewAppliersManagement from "@/pages/admin/NewAppliers";
import Payments from "@/components/admin/payments";

const AdminRoute = () => {
    return (
        <Routes>
            {/* ✅ Public Route - No protection */}
            <Route path="/" element={<AdminLogin />} />
            
            {/* ✅ Protected Routes - Admin Only */}
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout/>
                </ProtectedRoute>
              } 
            >
                <Route index element={<AdminDashboard/>} />
                <Route path="users" element={<Users/>} />
                <Route path="workers" element={<WorkerManagement/>} />
                <Route path="new-appliers" element={<NewAppliersManagement/>} />
                <Route path="payments" element={<Payments/>} />
            </Route>
        </Routes>
    )
}

export default AdminRoute;
