import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { logMood, getMoodLogs, getProfile } from "@/lib/wellness.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const MOODS = [
  { v: 1, e: "😞", l: "Low" },
  { v: 2, e: "😕", l: "Meh" },
  { v: 3, e: "😐", l: "Okay" },
  { v: 4, e: "🙂", l: "Good" },
  { v: 5, e: "😄", l: "Great" },
];

function Dashboard() {
  const qc = useQueryClient();
  const fetchLogs = useServerFn(getMoodLogs);
  const fetchProfile = useServerFn(getProfile);
  const saveMood = useServerFn(logMood);

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const { data: logs = [] } = useQuery({ queryKey: ["moods"], queryFn: () => fetchLogs() });

  const mutation = useMutation({
    mutationFn: () => saveMood({ data: { mood: mood!, energy: energy ?? undefined, note: note || undefined } }),
    onSuccess: () => {
      toast.success("Check-in saved 🌿");
      setMood(null);
      setEnergy(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["moods"] });
    },
    onError: () => toast.error("Could not save your check-in."),
  });

  const avg = logs.length
    ? (logs.reduce((s, l) => s + l.mood, 0) / logs.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Hi {profile?.display_name ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground">How are you feeling right now?</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Daily check-in</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.v}
              onClick={() => setMood(m.v)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-4 py-3 transition-all ${
                mood === m.v ? "border-primary bg-secondary" : "hover:bg-muted"
              }`}
            >
              <span className="text-2xl">{m.e}</span>
              <span className="text-xs text-muted-foreground">{m.l}</span>
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm font-medium">Energy level</p>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setEnergy(n)}
              className={`h-9 w-9 rounded-full border text-sm transition-all ${
                energy === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <Textarea
          className="mt-4"
          placeholder="Anything on your mind? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          variant="hero"
          className="mt-4"
          disabled={!mood || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving…" : "Save check-in"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Check-ins" value={String(logs.length)} />
        <Stat label="Avg mood" value={avg} />
        <Stat
          label="Last check-in"
          value={logs[0] ? new Date(logs[0].created_at).toLocaleDateString() : "—"}
        />
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">Recent check-ins</h2>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No check-ins yet. Log your first above.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {logs.slice(0, 8).map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-3">
                <span className="text-2xl">{MOODS.find((m) => m.v === l.mood)?.e}</span>
                <div className="flex-1">
                  {l.note && <p className="text-sm">{l.note}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString()}
                    {l.energy ? ` · energy ${l.energy}/5` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
