import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import { UserRole } from "workbee-common";
import { RouteSegments } from "@/constants/routes/route-segments";

import ApplyWorker from "@/pages/worker/ApplyWorker";
import WorkerLayout from "@/layout/WorkerLayout";
import WorkerDashboard from "@/pages/worker/WorkerDashboard";
import WorkerLogin from "@/pages/worker/WorkerLogin";
import Works from "@/pages/worker/Works";
import ClientMessages from "@/components/worker/messages/messages";
import ActiveWorks from "@/components/worker/active-works";
import WorkerWallet from "@/components/worker/wallet";
import WorkerAccountSettings from "@/components/worker/profile/account-settings";

const WorkerRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path={RouteSegments.WORKER.LOGIN} element={<WorkerLogin/>} />
            <Route path={RouteSegments.WORKER.APPLY} element={<ApplyWorker/>} />

            {/* Protected Routes - Worker Only */}
            <Route 
                path={RouteSegments.WORKER.DASHBOARD}
                element={
                    <ProtectedRoute allowedRoles={[UserRole.WORKER]}>
                        <WorkerLayout/>
                    </ProtectedRoute>
                }
            >
                <Route index element={<WorkerDashboard/>} />
                <Route path={RouteSegments.WORKER.WORKS} element={<Works/>} />
                <Route path={RouteSegments.WORKER.ACTIVE_WORKS} element={<ActiveWorks/>} />
                <Route path={RouteSegments.WORKER.MESSAGES} element={<ClientMessages/>} />
                <Route path={RouteSegments.WORKER.WALLET} element={<WorkerWallet/>} />
                <Route path={RouteSegments.WORKER.ACCOUNT} element={<WorkerAccountSettings/>} />
            </Route>
        </Routes>
    )
}

export default WorkerRoutes;
