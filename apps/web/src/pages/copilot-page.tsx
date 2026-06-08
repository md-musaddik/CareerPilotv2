import { CopilotWorkspace } from "@/features/copilot/copilot-workspace";

export function CopilotPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Copilot</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chat with CareerPilot using your resume and career context.</p>
      </div>
      <CopilotWorkspace />
    </div>
  );
}
