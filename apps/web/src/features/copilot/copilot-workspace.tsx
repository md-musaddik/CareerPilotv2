import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  BrainCircuit,
  FileCheck2,
  GraduationCap,
  Loader2,
  Map,
  MessageSquare,
  MessagesSquare,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { streamCopilotResponse } from "@/features/copilot/copilot-api";
import type { CopilotActionType, CopilotMessage } from "@/features/copilot/types";
import { cn } from "@/lib/utils";

const quickActions: Array<{
  type: CopilotActionType;
  title: string;
  description: string;
  prompt: string;
  icon: typeof Bot;
}> = [
  {
    type: "resume_review",
    title: "Resume Review",
    description: "Get prioritized resume improvements.",
    prompt: "Review my resume and give me the highest-impact improvements.",
    icon: FileCheck2,
  },
  {
    type: "skill_gap_analysis",
    title: "Skill Gap Analysis",
    description: "Compare my profile to my next role.",
    prompt: "Analyze my skill gaps for the roles I should target next.",
    icon: GraduationCap,
  },
  {
    type: "career_roadmap",
    title: "Career Roadmap",
    description: "Build a practical career plan.",
    prompt: "Create a career roadmap based on my resume and goals.",
    icon: Map,
  },
  {
    type: "cover_letter",
    title: "Cover Letter",
    description: "Draft a tailored letter.",
    prompt: "Help me draft a cover letter. Ask me for job details if needed.",
    icon: Sparkles,
  },
  {
    type: "interview_coach",
    title: "Interview Coach",
    description: "Practice questions and answers.",
    prompt: "Coach me for an interview using my resume context.",
    icon: Mic,
  },
  {
    type: "career_chat",
    title: "Career Chat",
    description: "Ask anything career-related.",
    prompt: "Help me decide the best next step in my job search.",
    icon: MessageSquare,
  },
];

const interviewCoachPrompts = [
  {
    title: "Behavioral Loop",
    description: "STAR-style practice with score-based feedback.",
    prompt: "Run a behavioral interview with me. Ask one question at a time and score each answer for clarity, evidence, and structure.",
    icon: MessagesSquare,
  },
  {
    title: "Technical Storytelling",
    description: "Push for tradeoffs, depth, and measurable outcomes.",
    prompt: "Coach me on technical interview answers using my resume. Push me to explain tradeoffs, scope, and outcomes clearly.",
    icon: BrainCircuit,
  },
  {
    title: "Confidence Pass",
    description: "Improve openings, follow-ups, and recovery moments.",
    prompt: "Help me rehearse for an interview. Focus on stronger openings, concise answers, and how to recover when I get stuck.",
    icon: ShieldCheck,
  },
] as const;

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Copilot failed. Please try again.";
}

export function CopilotWorkspace() {
  const { user } = useAuth();
  const [actionType, setActionType] = useState<CopilotActionType>("career_chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const messageLogRef = useRef<HTMLDivElement | null>(null);

  const activeAction = useMemo(
    () => quickActions.find((action) => action.type === actionType) ?? quickActions[quickActions.length - 1],
    [actionType],
  );
  const activeHelperPrompts = actionType === "interview_coach" ? interviewCoachPrompts : [];
  const placeholder = useMemo(() => {
    switch (actionType) {
      case "resume_review":
        return "Paste a target role, concern, or section you want reviewed.";
      case "skill_gap_analysis":
        return "Describe your target role or ask where your biggest gaps are.";
      case "career_roadmap":
        return "Ask for a 30, 60, or 90 day roadmap.";
      case "cover_letter":
        return "Paste a job link or role details for a draft worth reviewing.";
      case "interview_coach":
        return "Tell the coach what role you are interviewing for or start a mock loop.";
      case "career_chat":
      default:
        return "Ask about your resume, gaps, roadmap, cover letter, or interview prep.";
    }
  }, [actionType]);

  useEffect(() => {
    const logElement = messageLogRef.current;
    if (!logElement) {
      return;
    }

    logElement.scrollTop = logElement.scrollHeight;
  }, [messages, isStreaming]);

  async function sendMessage(message: string, selectedActionType = actionType) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isStreaming) {
      return;
    }

    const userMessage: CopilotMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmedMessage,
      actionType: selectedActionType,
    };
    const assistantMessageId = createMessageId();
    assistantMessageIdRef.current = assistantMessageId;

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        actionType: selectedActionType,
      },
    ]);
    setInput("");
    setError(null);
    setIsStreaming(true);

    try {
      await streamCopilotResponse(
        user,
        {
          message: trimmedMessage,
          actionType: selectedActionType,
          sessionId,
        },
        {
          onDelta: (delta) => {
            const currentAssistantId = assistantMessageIdRef.current;

            if (!currentAssistantId) {
              return;
            }

            setMessages((current) =>
              current.map((item) =>
                item.id === currentAssistantId
                  ? {
                      ...item,
                      content: item.content + delta,
                    }
                  : item,
              ),
            );
          },
          onDone: (nextSessionId, content) => {
            if (nextSessionId) {
              setSessionId(nextSessionId);
            }

            setMessages((current) =>
              current.map((item) =>
                item.id === assistantMessageId
                  ? {
                      ...item,
                      content: content || item.content,
                    }
                  : item,
              ),
            );
          },
        },
      );
    } catch (streamError) {
      setError(getErrorMessage(streamError));
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId && !item.content
            ? {
                ...item,
                content: "I could not complete that response. Please try again.",
              }
            : item,
        ),
      );
    } finally {
      setIsStreaming(false);
      assistantMessageIdRef.current = null;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleQuickAction(type: CopilotActionType, prompt: string) {
    setActionType(type);
    void sendMessage(prompt, type);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[20rem_1fr]">
      <aside className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold">Quick Actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Start with a focused career workflow.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.type}
                aria-pressed={actionType === action.type}
                className={cn(
                  "rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  actionType === action.type && "border-primary bg-accent text-accent-foreground",
                )}
                disabled={isStreaming}
                type="button"
                onClick={() => handleQuickAction(action.type, action.prompt)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Icon />
                  </span>
                  <span className="font-semibold">{action.title}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{action.description}</p>
              </button>
            );
          })}
        </div>
        {activeHelperPrompts.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold">Interview Coach Modes</h3>
              <p className="mt-1 text-sm text-muted-foreground">Launch a tighter practice flow without rewriting the prompt from scratch.</p>
            </div>
            {activeHelperPrompts.map((promptItem) => {
              const Icon = promptItem.icon;

              return (
                <button
                  key={promptItem.title}
                  className="rounded-lg border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  disabled={isStreaming}
                  type="button"
                  onClick={() => handleQuickAction("interview_coach", promptItem.prompt)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Icon />
                    </span>
                    <span className="font-semibold">{promptItem.title}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{promptItem.description}</p>
                </button>
              );
            })}
          </div>
        ) : null}
      </aside>

      <Card className="min-h-[calc(100vh-10rem)]">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{activeAction.title}</CardTitle>
              <CardDescription>{activeAction.description}</CardDescription>
            </div>
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Uses resume context</Badge>
            <Badge variant="secondary">Pulls goals and applications</Badge>
            <Badge variant="secondary">Retrieves relevant resume chunks</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-[32rem] flex-col gap-4">
          <div
            ref={messageLogRef}
            aria-busy={isStreaming}
            aria-live="polite"
            className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border bg-background p-4"
            role="log"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                <Bot />
                <p>Ask CareerPilot to review your resume, find gaps, plan your next move, draft a cover letter, or coach an interview.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[86%] rounded-lg px-4 py-3 text-sm leading-6",
                    message.role === "user"
                      ? "self-end bg-primary text-primary-foreground"
                      : "self-start border bg-card text-card-foreground",
                  )}
                >
                  {message.content || (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="animate-spin" />
                      Thinking
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="copilot-message">Message</FieldLabel>
                <Textarea
                  aria-invalid={Boolean(error)}
                  id="copilot-message"
                  className="min-h-24"
                  disabled={isStreaming}
                  placeholder={placeholder}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                />
              </Field>
              {error ? (
                <Field data-invalid="true">
                  <FieldError role="alert">{error}</FieldError>
                </Field>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {actionType === "cover_letter"
                    ? "Drafts stay in-chat for review before you use them externally."
                    : "Uses resume, goals, applications, chat history, and relevant resume chunks."}
                </p>
                <Button disabled={isStreaming || input.trim().length < 2} type="submit">
                  {isStreaming ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Send data-icon="inline-start" />}
                  Send
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
