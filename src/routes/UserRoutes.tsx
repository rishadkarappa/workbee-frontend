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

const UserRoute = () => {
  return (
    <Routes>
      {/*  Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="otp" element={<Otp />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password/:token" element={<ResetPassword />} />
      
      {/* Protected Routes - User Only */}
      <Route 
        path="task-booking" 
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <TaskBookForm />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/user-dashboard" 
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="works" element={<MyWorks />} />
        <Route path="active-works" element={<ActiveWorks />} />
        <Route path="messages" element={<WorkerMessages />} />
      </Route>
    </Routes>
  );
};

export default UserRoute;
