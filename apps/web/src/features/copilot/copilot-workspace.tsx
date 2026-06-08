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
  RotateCcw,
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
    description: "Highest-impact improvements",
    prompt: "Review my resume and give me the highest-impact improvements.",
    icon: FileCheck2,
  },
  {
    type: "skill_gap_analysis",
    title: "Skill Gap Analysis",
    description: "Compare profile to next role",
    prompt: "Analyze my skill gaps for the roles I should target next.",
    icon: GraduationCap,
  },
  {
    type: "career_roadmap",
    title: "Career Roadmap",
    description: "30 / 60 / 90 day plan",
    prompt: "Create a career roadmap based on my resume and goals.",
    icon: Map,
  },
  {
    type: "cover_letter",
    title: "Cover Letter",
    description: "Draft worth reviewing",
    prompt: "Help me draft a cover letter. Ask me for job details if needed.",
    icon: Sparkles,
  },
  {
    type: "interview_coach",
    title: "Interview Coach",
    description: "Practice and feedback",
    prompt: "Coach me for an interview using my resume context.",
    icon: Mic,
  },
  {
    type: "career_chat",
    title: "Career Chat",
    description: "General strategy help",
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

type PersistedAssistantSession = {
  actionType: CopilotActionType;
  sessionId?: string;
  messages: CopilotMessage[];
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AI Assistant failed. Please try again.";
}

function getStorageKey(userId: string) {
  return `careerpilot-ai-assistant-session:${userId}`;
}

export function CopilotWorkspace() {
  const { user, isLoading } = useAuth();
  const [actionType, setActionType] = useState<CopilotActionType>("career_chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const messageLogRef = useRef<HTMLDivElement | null>(null);
  const restoredUserIdRef = useRef<string | null>(null);

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
        return "Tell the assistant what role you are interviewing for or start a mock loop.";
      case "career_chat":
      default:
        return "Ask about your resume, fit, gaps, roadmap, cover letter, or interview prep.";
    }
  }, [actionType]);

  useEffect(() => {
    const logElement = messageLogRef.current;
    if (!logElement) {
      return;
    }

    logElement.scrollTop = logElement.scrollHeight;
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      setMessages([]);
      setSessionId(undefined);
      setActionType("career_chat");
      restoredUserIdRef.current = null;
      return;
    }

    if (restoredUserIdRef.current === user.uid) {
      return;
    }

    const rawValue = sessionStorage.getItem(getStorageKey(user.uid));

    if (!rawValue) {
      restoredUserIdRef.current = user.uid;
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as PersistedAssistantSession;
      setActionType(parsed.actionType ?? "career_chat");
      setSessionId(parsed.sessionId);
      setMessages(parsed.messages ?? []);
      restoredUserIdRef.current = user.uid;
    } catch {
      sessionStorage.removeItem(getStorageKey(user.uid));
      restoredUserIdRef.current = user.uid;
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!user || isLoading) {
      return;
    }

    const payload: PersistedAssistantSession = {
      actionType,
      sessionId,
      messages,
    };

    sessionStorage.setItem(getStorageKey(user.uid), JSON.stringify(payload));
  }, [actionType, isLoading, messages, sessionId, user]);

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
    setActionType(selectedActionType);

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
    void sendMessage(prompt, type);
  }

  function handleResetSession() {
    if (user) {
      sessionStorage.removeItem(getStorageKey(user.uid));
    }

    setMessages([]);
    setSessionId(undefined);
    setInput("");
    setError(null);
    setActionType("career_chat");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 pt-2">
      <Card className="min-h-[calc(100vh-11rem)]">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{activeAction.title}</CardTitle>
              <CardDescription>
                Chat-first workspace grounded in your resume, goals, applications, chat history, and relevant resume chunks.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Session memory enabled</Badge>
              <Button disabled={isStreaming} size="sm" type="button" variant="outline" onClick={handleResetSession}>
                <RotateCcw data-icon="inline-start" />
                New session
              </Button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isActive = action.type === actionType;

              return (
                <button
                  key={action.type}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-background px-3 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/20",
                    isActive && "border-foreground/20 bg-foreground/[0.045]",
                  )}
                  disabled={isStreaming}
                  type="button"
                  onClick={() => setActionType(action.type)}
                >
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{action.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {activeHelperPrompts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeHelperPrompts.map((promptItem) => {
                const Icon = promptItem.icon;
                return (
                  <Button
                    key={promptItem.title}
                    disabled={isStreaming}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => handleQuickAction("interview_coach", promptItem.prompt)}
                  >
                    <Icon data-icon="inline-start" />
                    {promptItem.title}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="flex min-h-[34rem] flex-col gap-4">
          <div
            ref={messageLogRef}
            aria-busy={isStreaming}
            aria-live="polite"
            className="flex min-h-[24rem] flex-1 flex-col gap-4 overflow-y-auto rounded-lg border bg-background p-4 sm:p-5"
            role="log"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                <Bot />
                <p>Ask the AI Assistant to review your resume, find job-fit gaps, build a roadmap, draft a letter, or coach an interview.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
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
            <FieldGroup className="gap-3">
              <Field>
                <Textarea
                  aria-invalid={Boolean(error)}
                  className="min-h-24 max-h-32 resize-none overflow-y-auto rounded-2xl"
                  disabled={isStreaming}
                  id="copilot-message"
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
                    : "Conversation state is kept for this session, even if you move to another page."}
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
