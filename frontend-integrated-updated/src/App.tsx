import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

import LandingPage from "./pages/LandingPage";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CustomerDashboard from "./pages/CustomerDashboard";
import Chat from "./pages/Chat";
import History from "./pages/History";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import AdminConversations from "./pages/AdminConversations";
import SecurityEvents from "./pages/SecurityEvents";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import AdminSupportTickets from "./pages/AdminSupportTickets";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      
        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute role="customer">
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute role="customer">
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <ProtectedRoute role="customer">
              <Activity />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute role="customer">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={
            <ProtectedRoute role="customer">
              <Settings />
            </ProtectedRoute>
          } />

        <Route
          path="/help-support"
          element={
            <ProtectedRoute role="customer">
              <HelpSupport />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/conversations"
          element={
            <ProtectedRoute role="admin">
              <AdminConversations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/security"
          element={
            <ProtectedRoute role="admin">
              <SecurityEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/activity"
          element={
            <ProtectedRoute role="admin">
              <AdminActivityLogs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute role="admin">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/support-tickets"
          element={
            <ProtectedRoute role="admin">
              <AdminSupportTickets />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/settings" element={
            <ProtectedRoute role="admin">
              <AdminSettings />
            </ProtectedRoute>
          } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;