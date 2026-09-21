import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import MainLayout from "./layouts/MainLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import Home from "./pages/Home.jsx";
import Verify from "./pages/Verify.jsx";
import Report from "./pages/Report.jsx";
import Alerts from "./pages/Alerts.jsx";
import Civic from "./pages/Civic.jsx";
import CivicDetail from "./pages/CivicDetail.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";

import Dashboard from "./pages/Dashboard.jsx";

import Reports from "./pages/dashboard/Reports.jsx";
import Verification from "./pages/dashboard/Verification.jsx";
import ReviewQueue from "./pages/dashboard/ReviewQueue.jsx";
import DashboardAlerts from "./pages/dashboard/Alerts.jsx";
import DashboardCivic from "./pages/dashboard/Civic.jsx";
import Sources from "./pages/dashboard/Sources.jsx";
import Users from "./pages/dashboard/Users.jsx";
import Settings from "./pages/dashboard/Settings.jsx";
import Sms from "./pages/dashboard/Sms.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* =================================================
              PUBLIC ROUTES
              ================================================= */}

          <Route element={<MainLayout />}>
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/verify"
              element={<Verify />}
            />

            <Route
              path="/report"
              element={<Report />}
            />

            <Route
              path="/alerts"
              element={<Alerts />}
            />

            <Route
              path="/civic"
              element={<Civic />}
            />

            <Route
              path="/civic/:id"
              element={<CivicDetail />}
            />

            <Route
              path="/about"
              element={<About />}
            />
          </Route>

          {/* =================================================
              AUTHENTICATION
              ================================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          {/* =================================================
              PROTECTED DASHBOARD
              ================================================= */}

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<DashboardLayout />}
            >
              <Route
                index
                element={<Dashboard />}
              />

              <Route
                path="reports"
                element={<Reports />}
              />

              <Route
                path="verification"
                element={<Verification />}
              />

              <Route
                path="review-queue"
                element={<ReviewQueue />}
              />

              <Route
                path="alerts"
                element={<DashboardAlerts />}
              />

              <Route
                path="civic"
                element={<DashboardCivic />}
              />

              <Route
                path="sources"
                element={<Sources />}
              />

              <Route
                path="users"
                element={<Users />}
              />

              <Route
                path="settings"
                element={<Settings />}
              />

              <Route
                path="sms"
                element={<Sms />}
              />
            </Route>
          </Route>

          {/* =================================================
              404
              ================================================= */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}