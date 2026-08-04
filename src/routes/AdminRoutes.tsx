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
import { UserRole } from "workbee-common";
import { RouteSegments } from "@/constants/routes/route-segments";

const AdminRoute = () => {
    return (
        <Routes>
            {/* Public Route - No protection */}
            <Route path="/" element={<AdminLogin />} />
            
            {/* Protected Routes - Admin Only */}
            <Route 
              path={RouteSegments.ADMIN.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <AdminLayout/>
                </ProtectedRoute>
              } 
            >
                <Route index element={<AdminDashboard/>} />
                <Route path={RouteSegments.ADMIN.USERS} element={<Users/>} />
                <Route path={RouteSegments.ADMIN.WORKERS} element={<WorkerManagement/>} />
                <Route path={RouteSegments.ADMIN.NEW_APPLIERS} element={<NewAppliersManagement/>} />
                <Route path={RouteSegments.ADMIN.PAYMENTS} element={<Payments/>} />
            </Route>
        </Routes>
    )
}

export default AdminRoute;
