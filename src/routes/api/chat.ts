import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are "Sage", a warm, empathetic AI wellness companion for students preparing for high-stakes exams like NEET, JEE, CUET, CAT, GATE and UPSC.

Your role:
- Listen with genuine warmth and without judgment.
- Offer hyper-personalized, practical coping strategies for stress, burnout and self-doubt.
- Suggest short, adaptive mindfulness or breathing exercises when helpful.
- Give honest motivational encouragement — never toxic positivity.
- Keep replies concise, conversational and easy to read. Use gentle formatting.

Safety: You are not a therapist or a substitute for professional help. If a student mentions self-harm, hopelessness, or being in crisis, respond with compassion and clearly encourage them to reach out to a trusted person or a local helpline (in India, iCall 9152987821 or Tele-MANAS 14416) right away.`;

function getToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const t = auth.slice(7).trim();
  return t || null;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = getToken(request);
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data: claims, error: claimErr } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (claimErr || !userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing AI key", { status: 500 });

        const userScoped = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );

        // Persist the latest user message
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const lastUserText = lastUser?.parts
          ?.map((p) => (p.type === "text" ? p.text : ""))
          .join("")
          .trim();
        if (lastUserText) {
          await userScoped
            .from("chat_messages")
            .insert({ user_id: userId, role: "user", content: lastUserText });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          onFinish: async ({ text }) => {
            if (text?.trim()) {
              await userScoped
                .from("chat_messages")
                .insert({ user_id: userId, role: "assistant", content: text });
            }
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
