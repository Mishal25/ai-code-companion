import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brain, BookHeart, MessageCircleHeart, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sage — AI Mental Wellness Companion for Students" },
      {
        name: "description",
        content:
          "Sage helps students beat exam stress with daily journaling, mood tracking, and an empathetic AI companion that uncovers hidden stress triggers.",
      },
      { property: "og:title", content: "Sage — AI Mental Wellness Companion for Students" },
      {
        property: "og:description",
        content: "Daily journaling, mood tracking, and an empathetic AI companion for exam season.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BookHeart, title: "Daily journaling", desc: "Write freely. Sage reads between the lines to surface hidden stress." },
  { icon: Brain, title: "AI insight engine", desc: "Spot emotional patterns and triggers standard trackers miss." },
  { icon: MessageCircleHeart, title: "Always-on companion", desc: "Talk through self-doubt and get tailored coping strategies, anytime." },
  { icon: ShieldCheck, title: "Private & yours", desc: "Your reflections are encrypted and visible only to you." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Sage logo" width={36} height={36} className="h-9 w-9" />
          <span className="font-display text-xl font-semibold">Sage</span>
        </div>
        <Button asChild variant="hero">
          <Link to="/auth">Get started</Link>
        </Button>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              For NEET · JEE · CUET · CAT · GATE · UPSC aspirants
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Your calm corner during the toughest exams.
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Sage is an AI wellness companion that helps you monitor your mind, uncover hidden stress
              triggers, and stay grounded — one honest reflection at a time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth">Start for free</Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/auth">I have an account</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={hero}
              alt="Calm rolling hills illustration"
              width={1600}
              height={1100}
              className="w-full rounded-3xl border object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground">
          Sage is a supportive tool, not a substitute for professional care. In crisis (India), call
          Tele-MANAS 14416 or iCall 9152987821.
        </div>
      </footer>
    </div>
  );
}
