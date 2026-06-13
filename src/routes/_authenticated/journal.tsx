import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createJournalEntry, getJournalEntries } from "@/lib/wellness.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkle, Lightbulb, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/_authenticated/journal")({
  component: Journal,
});

type Analysis = {
  sentiment: string;
  summary: string;
  stress_triggers: string[];
  emotional_patterns: string[];
  coping_suggestions: string[];
  encouragement: string;
};

function Journal() {
  const qc = useQueryClient();
  const fetchEntries = useServerFn(getJournalEntries);
  const create = useServerFn(createJournalEntry);
  const [content, setContent] = useState("");

  const { data: entries = [] } = useQuery({ queryKey: ["journal"], queryFn: () => fetchEntries() });

  const mutation = useMutation({
    mutationFn: () => create({ data: { content } }),
    onSuccess: () => {
      toast.success("Entry saved. Sage reflected on it 🌱");
      setContent("");
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
    onError: () => toast.error("Could not save your entry."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Journal</h1>
        <p className="text-muted-foreground">
          Write openly — Sage gently surfaces patterns and triggers you might miss.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <Textarea
          rows={6}
          placeholder="Today I felt… What weighed on me was…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button
          variant="hero"
          className="mt-4"
          disabled={content.trim().length < 3 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Reflecting…" : "Save & analyze"}
        </Button>
      </div>

      <div className="space-y-4">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">Your reflections will appear here.</p>
        )}
        {entries.map((entry) => {
          const a = entry.ai_analysis as Analysis | null;
          return (
            <div key={entry.id} className="rounded-2xl border bg-card p-6 shadow-card">
              <p className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>

              {a && (
                <div className="mt-4 space-y-3 rounded-xl bg-secondary/60 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkle className="h-4 w-4" /> Sage's reflection
                  </p>
                  <p className="text-sm text-foreground">{a.summary}</p>
                  {a.stress_triggers?.length > 0 && (
                    <Tags label="Possible triggers" items={a.stress_triggers} />
                  )}
                  {a.emotional_patterns?.length > 0 && (
                    <Tags label="Patterns" items={a.emotional_patterns} />
                  )}
                  {a.coping_suggestions?.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Lightbulb className="h-3.5 w-3.5" /> Try this
                      </p>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        {a.coping_suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {a.encouragement && (
                    <p className="flex items-start gap-2 text-sm italic text-accent-foreground">
                      <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0" /> {a.encouragement}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tags({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((t, i) => (
          <span key={i} className="rounded-full bg-card px-2.5 py-1 text-xs">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
