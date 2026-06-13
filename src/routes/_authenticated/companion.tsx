import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { getChatHistory } from "@/lib/wellness.functions";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/companion")({
  component: Companion,
});

function Companion() {
  const fetchHistory = useServerFn(getChatHistory);
  const { data: history, isLoading } = useQuery({
    queryKey: ["chat-history"],
    queryFn: () => fetchHistory(),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your conversation…</p>;
  }

  const initial: UIMessage[] = (history ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text", text: m.content }],
  }));

  return <Chat initial={initial} />;
}

function Chat({ initial }: { initial: UIMessage[] }) {
  const [input, setInput] = useState("");
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      headers: async () => {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  );

  const { messages, sendMessage, status } = useChat({
    id: "companion",
    messages: initial,
    transport: transport.current,
    onError: () => toast.error("Sage couldn't respond right now. Please try again."),
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit() {
    if (!input.trim() || busy) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col rounded-2xl border bg-card shadow-card">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<img src={logo} alt="Sage" width={48} height={48} className="h-12 w-12" />}
              title="Talk to Sage"
              description="Share what's on your mind. Everything you say stays private."
            />
          )}
          {messages.map((m) => (
            <Message from={m.role} key={m.id}>
              <MessageContent>
                {m.parts.map((p, i) =>
                  p.type === "text" ? <MessageResponse key={i}>{p.text}</MessageResponse> : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Sage is thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput
          onSubmit={(_, e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type how you're feeling…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
