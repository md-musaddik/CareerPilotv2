import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RouteLoadingScreen } from "@/routes/route-loading";
import { ProtectedRoute } from "@/routes/protected-route";

const DashboardLayout = lazy(() => import("@/layouts/dashboard-layout").then((module) => ({ default: module.DashboardLayout })));
const CopilotPage = lazy(() => import("@/pages/copilot-page").then((module) => ({ default: module.CopilotPage })));
const DashboardPage = lazy(() => import("@/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const HomePage = lazy(() => import("@/pages/home-page").then((module) => ({ default: module.HomePage })));
const JobsPage = lazy(() => import("@/pages/jobs-page").then((module) => ({ default: module.JobsPage })));
const NotFoundPage = lazy(() => import("@/pages/not-found-page").then((module) => ({ default: module.NotFoundPage })));
const WorkspacePage = lazy(() => import("@/pages/workspace-page").then((module) => ({ default: module.WorkspacePage })));

function withSuspense(children: ReactNode) {
  return <Suspense fallback={<RouteLoadingScreen />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<HomePage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: withSuspense(<DashboardLayout />),
        children: [
          {
            index: true,
            element: withSuspense(<DashboardPage />),
          },
          {
            path: "jobs",
            element: withSuspense(<JobsPage />),
          },
          {
            path: "assistant",
            element: withSuspense(<CopilotPage />),
          },
          {
            path: "copilot",
            element: <Navigate replace to="/dashboard/assistant" />,
          },
          {
            path: "workspace",
            element: withSuspense(<WorkspacePage />),
          },
        ],
      },
    ],
  },
  {
    path: "/home",
    element: <Navigate replace to="/" />,
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />),
  },
]);
