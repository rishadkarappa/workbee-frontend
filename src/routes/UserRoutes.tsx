import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

import { UserRole } from "workbee-common";
import { RouteSegments } from "@/constants/routes/route-segments";

import Home from "@/pages/user/Home";
import Login from "@/pages/user/Login";
import Register from "@/pages/user/Register";
import Otp from "@/pages/user/VerifyOtp";
import ForgotPassword from "@/pages/user/ForgotPassword";
import ResetPassword from "@/pages/user/ResetPassword";
import TaskBookForm from "@/pages/user/TaskBookForm";
import Dashboard from "@/pages/user/UserDashboard";

// inner dashboard components
import MyWorks from "@/components/user/dashboard/my-works/components/work-content";
import WorkerMessages from "@/components/user/dashboard/messages/page";
import ActiveWorks from "@/components/user/dashboard/live-works/page";
import UserWallet from "@/components/user/dashboard/wallet/page";
import ProfileSettings from "@/components/user/dashboard/profile-settings/page";
import DashboardPostWork from "@/components/user/dashboard/post-work/page";


const UserRoute = () => {
  return (
    <Routes>
      {/*  Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path={RouteSegments.USER.LOGIN} element={<Login />} />
      <Route path={RouteSegments.USER.REGISTER} element={<Register />} />
      <Route path={RouteSegments.USER.OTP} element={<Otp />} />
      <Route path={RouteSegments.USER.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={RouteSegments.USER.RESET_PASSWORD} element={<ResetPassword />} />
      
      {/* Protected Routes - User Only */}
      <Route 
        path={RouteSegments.USER.TASK_BOOKING}
        element={
          <ProtectedRoute allowedRoles={[UserRole.USER]}>
            <TaskBookForm />
          </ProtectedRoute>
        } 
      />

      <Route path={RouteSegments.USER.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[UserRole.USER]}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={RouteSegments.USER.WORKS} replace />} />
        <Route path={RouteSegments.USER.WORKS} element={<MyWorks />} />
        <Route path={RouteSegments.USER.ACTIVE_WORKS} element={<ActiveWorks />} />
        <Route path={RouteSegments.USER.MESSAGES} element={<WorkerMessages />} />
        <Route path={RouteSegments.USER.WALLET} element={<UserWallet />} />
        <Route path={RouteSegments.USER.PROFILE} element={<ProfileSettings/>}/>
        <Route path={RouteSegments.USER.POST_WORK} element={<DashboardPostWork/>}/>
      </Route>
    </Routes>
  );
};

export default UserRoute;
