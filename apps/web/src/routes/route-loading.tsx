import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoadingScreen() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 border-r bg-card p-4 lg:block">
        <Skeleton className="h-10 w-36" />
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <main className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="size-10 rounded-full" />
        </div>
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Skeleton className="h-[24rem]" />
            <Skeleton className="h-[24rem]" />
          </div>
        </div>
      </main>
    </div>
  );
}
