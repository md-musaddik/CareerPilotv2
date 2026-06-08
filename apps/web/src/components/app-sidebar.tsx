import { Bot, BriefcaseBusiness, LayoutDashboard, PanelsTopLeft } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Jobs",
    href: "/dashboard/jobs",
    icon: BriefcaseBusiness,
  },
  {
    label: "Copilot",
    href: "/dashboard/copilot",
    icon: Bot,
  },
  {
    label: "Workspace",
    href: "/dashboard/workspace",
    icon: PanelsTopLeft,
  },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-5">
        <NavLink className="flex items-center gap-2 font-semibold" to="/dashboard" onClick={onNavigate}>
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            CP
          </span>
          <span>CareerPilot</span>
        </NavLink>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Dashboard navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              end={item.href === "/dashboard"}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )
              }
            >
              <Icon />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs font-medium text-muted-foreground">Phase 8</p>
        <p className="mt-1 text-sm">Hackathon-ready demo shell with analytics, AI coaching, and workspace polish.</p>
      </div>
    </aside>
  );
}
