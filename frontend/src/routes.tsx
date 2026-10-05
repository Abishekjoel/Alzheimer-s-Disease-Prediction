import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { PublicLayout } from "@/components/layout/PublicLayout";

const Landing = lazy(() => import("@/pages/Landing/Landing"));
const About = lazy(() => import("@/pages/About/About"));
const Research = lazy(() => import("@/pages/Research/Research"));
const Login = lazy(() => import("@/pages/Login/Login"));
const Register = lazy(() => import("@/pages/Register/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword/ForgotPassword"));
const Privacy = lazy(() => import("@/pages/Legal/Privacy"));
const Terms = lazy(() => import("@/pages/Legal/Terms"));

const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));
const Analyze = lazy(() => import("@/pages/Analyze/Analyze"));
const Results = lazy(() => import("@/pages/Results/Results"));
const History = lazy(() => import("@/pages/History/History"));
const Users = lazy(() => import("@/pages/Users/Users"));
const UserDetails = lazy(() => import("@/pages/Users/UserDetails"));
const Reports = lazy(() => import("@/pages/Reports/Reports"));
const Profile = lazy(() => import("@/pages/Profile/Profile"));
const Settings = lazy(() => import("@/pages/Settings/Settings"));

const NotFound = lazy(() => import("@/pages/System/NotFound"));
const ServerError = lazy(() => import("@/pages/System/ServerError"));
const Unauthorized = lazy(() => import("@/pages/System/Unauthorized"));
const Maintenance = lazy(() => import("@/pages/System/Maintenance"));

function RouteFallback() {
  return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-ink-muted">Loading…</div>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/research" element={<Research />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        <Route path="/app" element={<AppShell />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="results/:id" element={<Results />} />
          <Route path="history" element={<History />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/401" element={<Unauthorized />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
