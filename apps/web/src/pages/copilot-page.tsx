import { CopilotWorkspace } from "@/features/copilot/copilot-workspace";

export function CopilotPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chat with CareerPilot using your resume, goals, applications, and session memory.</p>
      </div>
      <CopilotWorkspace />
    </div>
  );
}
