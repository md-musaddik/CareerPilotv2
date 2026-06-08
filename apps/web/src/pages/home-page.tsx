import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { AuthForm } from "@/features/auth/auth-form";
import { useAuth } from "@/features/auth/auth-context";

type AuthMode = "login" | "signup";

export function HomePage() {
  const { isLoading, user } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Link className="flex items-center gap-2 font-semibold" to="/">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            CP
          </span>
          <span>CareerPilot</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <Skeleton className="h-10 w-28" />
          ) : user ? (
            <UserProfileMenu />
          ) : (
            <>
              <Button variant="ghost" onClick={() => setAuthMode("login")}>
                Login
              </Button>
              <Button onClick={() => setAuthMode("signup")}>Signup</Button>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1fr_28rem] lg:items-center lg:py-16">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
              Run your career search from one focused workspace.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              CareerPilot ties resume intelligence, fit scoring, AI coaching, applications, goals, and calendar planning into one calm command center.
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" />
              Checking session
            </div>
          ) : user ? (
            <Button asChild className="w-fit">
              <Link to="/dashboard">
                Open dashboard
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setAuthMode("login")}>Login</Button>
              <Button variant="outline" onClick={() => setAuthMode("signup")}>
                Signup
              </Button>
            </div>
          )}
        </section>
        {isLoading ? (
          <section className="flex flex-col gap-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-96 w-full" />
          </section>
        ) : user ? (
          <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">Signed in</h2>
            <p className="mt-2 text-sm text-muted-foreground">Jump into the dashboard to review resume strength, workspace analytics, and Copilot guidance.</p>
          </section>
        ) : (
          <AuthForm mode={authMode} onModeChange={setAuthMode} />
        )}
      </main>
    </div>
  );
}
