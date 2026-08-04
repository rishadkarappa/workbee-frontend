import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import Home from "@/pages/user/Home";
import Login from "@/pages/user/Login";
import Register from "@/pages/user/Register";
import Otp from "@/pages/user/VerifyOtp";
import ForgotPassword from "@/pages/user/ForgotPassword";
import ResetPassword from "@/pages/user/ResetPassword";
import TaskBookForm from "@/pages/user/TaskBookForm";
import Dashboard from "@/pages/user/UserDashboard";

// inner dashboard components
import DashboardHome from "@/components/user/dashboard/DashboardHome";
import MyWorks from "@/components/user/dashboard/my-works/components/work-content";
import WorkerMessages from "@/components/user/dashboard/messages/page";
import ActiveWorks from "@/components/user/dashboard/live-works/page";
import UserWallet from "@/components/user/dashboard/wallet/page";
import { UserRole } from "workbee-common";
import { AppRoutes } from "@/constants/app-routes";

const UserRoute = () => {
  return (
    <Routes>
      {/*  Public Routes */}
      <Route path={AppRoutes.HOME} element={<Home />} />
      <Route path={AppRoutes.USER_ROUTES.LOGIN} element={<Login />} />
      <Route path={AppRoutes.USER_ROUTES.REGISTER} element={<Register />} />
      <Route path={AppRoutes.USER_ROUTES.OTP} element={<Otp />} />
      <Route path={AppRoutes.USER_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={AppRoutes.USER_ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

      {/* Protected Routes - User Only */}
      <Route
        path={AppRoutes.USER_ROUTES.TASK_BOOKING} element={
          <ProtectedRoute allowedRoles={[UserRole.USER]}>
            <TaskBookForm />
          </ProtectedRoute>
        }
      />

      <Route
        path={AppRoutes.USER_ROUTES.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[UserRole.USER]}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path={AppRoutes.USER_ROUTES.MY_WORKS} element={<MyWorks />} />
        <Route path={AppRoutes.USER_ROUTES.ACTIVE_WORKS} element={<ActiveWorks />} />
        <Route path={AppRoutes.USER_ROUTES.MESSAGES} element={<WorkerMessages />} />
        <Route path={AppRoutes.USER_ROUTES.WALLET} element={<UserWallet />} />
      </Route>
    </Routes>
  );
};

export default UserRoute;
