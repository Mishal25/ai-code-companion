import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MoodInput = z.object({
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
});

export const logMood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MoodInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mood_logs").insert({
      user_id: context.userId,
      mood: data.mood,
      energy: data.energy ?? null,
      note: data.note?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMoodLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mood_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const analysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "mixed", "negative"]),
  summary: z.string(),
  stress_triggers: z.array(z.string()),
  emotional_patterns: z.array(z.string()),
  coping_suggestions: z.array(z.string()),
  encouragement: z.string(),
});

async function analyzeJournal(content: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: analysisSchema }),
      system:
        "You are a warm, supportive wellness analyst for students preparing for high-stakes exams (NEET, JEE, UPSC, etc.). Read a journal entry and gently surface hidden stress triggers and emotional patterns. Be encouraging, never clinical or alarming. Suggestions must be simple and actionable.",
      prompt: `Analyze this student's journal entry:\n\n"""${content}"""`,
    });
    return output;
  } catch (e) {
    console.error("Journal analysis failed", e);
    return null;
  }
}

const JournalInput = z.object({
  content: z.string().min(1).max(8000),
  mood: z.number().int().min(1).max(5).optional(),
});

export const createJournalEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => JournalInput.parse(d))
  .handler(async ({ data, context }) => {
    const analysis = await analyzeJournal(data.content);
    const { data: row, error } = await context.supabase
      .from("journal_entries")
      .insert({
        user_id: context.userId,
        content: data.content.trim(),
        mood: data.mood ?? null,
        ai_analysis: analysis,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("journal_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    return data;
  });

export const getChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
