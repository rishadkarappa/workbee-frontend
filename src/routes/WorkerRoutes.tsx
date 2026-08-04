import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import ApplyWorker from "@/pages/worker/ApplyWorker";
import WorkerLayout from "@/layout/WorkerLayout";
import WorkerDashboard from "@/pages/worker/WorkerDashboard";
import WorkerLogin from "@/pages/worker/WorkerLogin";
import Works from "@/pages/worker/Works";
import ClientMessages from "@/components/worker/messages/messages";
import ActiveWorks from "@/components/worker/active-works";
import WorkerWallet from "@/components/worker/wallet";
import { UserRole } from "workbee-common";
import { AppRoutes } from "@/constants/app-routes";

const WorkerRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path={AppRoutes.WORKER.LOGIN} element={<WorkerLogin/>} />
            <Route path={AppRoutes.WORKER.APPLY}  element={<ApplyWorker/>} />

            {/* Protected Routes - Worker Only */}
            <Route 
                path={AppRoutes.WORKER.DASHBOARD}
                element={
                    <ProtectedRoute allowedRoles={[UserRole.WORKER]}>
                        <WorkerLayout/>
                    </ProtectedRoute>
                }
            >
                <Route index element={<WorkerDashboard/>} />
                <Route path={AppRoutes.WORKER.WORKS} element={<Works/>} />
                <Route path={AppRoutes.WORKER.ACTIVE_WORKS} element={<ActiveWorks/>} />
                <Route path={AppRoutes.WORKER.CLIENT_MESSAGES} element={<ClientMessages/>} />
                <Route path={AppRoutes.WORKER.WALLET} element={<WorkerWallet/>} />
            </Route>
        </Routes>
    )
}

export default WorkerRoutes;
