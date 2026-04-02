import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import ApplyWorker from "@/pages/worker/ApplyWorker";
import WorkerLayout from "@/layout/WorkerLayout";
import WorkerDashboard from "@/pages/worker/WorkerDashboard";
import WorkerLogin from "@/pages/worker/WorkerLogin";
import Works from "@/pages/worker/Works";
import ClientMessages from "@/components/worker/messages";
import ActiveWorks from "@/components/worker/active-works";

const WorkerRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="worker-login" element={<WorkerLogin/>} />
            <Route path="apply-worker" element={<ApplyWorker/>} />

            {/* Protected Routes - Worker Only */}
            <Route 
                path="worker-dashboard" 
                element={
                    <ProtectedRoute allowedRoles={["worker"]}>
                        <WorkerLayout/>
                    </ProtectedRoute>
                }
            >
                <Route index element={<WorkerDashboard/>} />
                <Route path="works" element={<Works/>} />
                <Route path="active-works" element={<ActiveWorks/>} />
                <Route path="client-messages" element={<ClientMessages/>} />
            </Route>
        </Routes>
    )
}

export default WorkerRoutes;
