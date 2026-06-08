import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <AppSidebar />
      </div>
      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close sidebar"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative h-full">
            <AppSidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <AppHeader onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

