import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";

function ProtectedRouteLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 border-r bg-card p-4 lg:block">
        <Skeleton className="h-10 w-36" />
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <main className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="size-10 rounded-full" />
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </main>
    </div>
  );
}

export function ProtectedRoute() {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <ProtectedRouteLoading />;
  }

  if (!user) {
    return <Navigate replace to="/" state={{ from: location }} />;
  }

  return <Outlet />;
}

