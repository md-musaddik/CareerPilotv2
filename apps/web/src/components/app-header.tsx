import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";

export function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Button aria-label="Open sidebar" className="lg:hidden" size="icon" variant="ghost" onClick={onOpenSidebar}>
          <Menu />
        </Button>
        <div>
          <p className="text-sm font-semibold">CareerPilot</p>
          <p className="text-xs text-muted-foreground">Career operating system</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserProfileMenu />
      </div>
    </header>
  );
}

