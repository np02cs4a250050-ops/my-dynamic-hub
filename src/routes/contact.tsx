import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { submitEnquiry } from "@/lib/content.functions";
import { PageHero, Section } from "@/components/site/Bits";
import { Turnstile } from "@/components/site/Turnstile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const INTERESTS = [
  "Interior design consultation",
  "Full interior styling",
  "Custom handcrafted commission",
  "Buying a product",
  "Workshops and training",
  "Collaboration or wholesale",
  "General",
];

export const Route = createFileRoute("/contact")({
  validateSearch: z.object({ interest: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Contact & Enquiries — KRITI'S KIRTI" },
      {
        name: "description",
        content:
          "Book an interior design consultation, request a handcrafted jute commission, or ask about products, gift sets and workshops with KRITI'S KIRTI.",
      },
      { property: "og:title", content: "Get in touch — KRITI'S KIRTI" },
      {
        property: "og:description",
        content:
          "Tell us about your space or the piece you have in mind, and we'll reply with ideas, a timeline and a quotation.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { interest: initialInterest } = Route.useSearch();
  const send = useServerFn(submitEnquiry);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [formAttempt, setFormAttempt] = useState(0);
  const turnstileEnabled = Boolean(import.meta.env["VITE_TURNSTILE_SITE_KEY"]);

  const presetInterest =
    initialInterest && !INTERESTS.includes(initialInterest)
      ? `Buying a product: ${initialInterest}`
      : (initialInterest ?? "General");
  const interestOptions = INTERESTS.includes(presetInterest)
    ? INTERESTS
    : [presetInterest, ...INTERESTS];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSubmitting(true);
    try {
      await send({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          interest: String(fd.get("interest") ?? "General"),
          message: String(fd.get("message") ?? ""),
          website: String(fd.get("website") ?? ""),
          turnstileToken,
        },
      });
      form.reset();
      setSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("rate_limited")) {
        toast.error("You've sent several enquiries recently. Please try again in an hour.");
      } else if (message.includes("captcha_failed")) {
        toast.error("Please complete the verification and try again.");
      } else {
        toast.error(
          "Please check your details — name, a valid email and a short message are needed.",
        );
      }
      setTurnstileToken("");
      setFormAttempt((attempt) => attempt + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell us about your space, or the piece you have in mind"
        description="Consultations, commissions, product orders, gift sets and workshops — every enquiry is read personally and answered within a few working days."
      />

      <Section>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr]">
          <aside className="space-y-10">
            <div>
              <p className="eyebrow">Studio</p>
              <p className="mt-3 text-base text-foreground">Kathmandu Valley, Nepal</p>
              <p className="mt-1 text-sm text-muted-foreground">Visits by appointment only</p>
            </div>
            <div>
              <p className="eyebrow">Helpful to include</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                <li>Room or piece dimensions, if you know them</li>
                <li>A few photos or a reference you love</li>
                <li>Your timeline and approximate budget</li>
              </ul>
            </div>
            <div className="rounded-sm border border-border bg-secondary/40 p-6">
              <p className="font-display text-lg leading-snug text-foreground">
                Think Local. Design Creatively. Build Sustainably.
              </p>
            </div>
          </aside>

          {sent ? (
            <div className="flex flex-col items-start justify-center rounded-sm border border-border bg-card p-10 shadow-soft">
              <CheckCircle2 className="size-8 text-primary" />
              <h2 className="mt-5 text-2xl text-foreground">Thank you — your enquiry is in.</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                We'll read it carefully and reply by email within a few working days.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-accent hover:text-foreground"
              >
                Send another enquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="space-y-6 rounded-sm border border-border bg-card p-6 shadow-soft sm:p-10"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" name="name" required minLength={2} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required maxLength={180} />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" name="phone" type="tel" maxLength={40} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest">I'm interested in</Label>
                  <select
                    id="interest"
                    name="interest"
                    defaultValue={presetInterest}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {interestOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={6}
                  placeholder="Tell us about the space, the piece, sizes, colours or timeline…"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
              >
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <Turnstile key={formAttempt} onToken={setTurnstileToken} />
              <button
                type="submit"
                disabled={submitting || (turnstileEnabled && !turnstileToken)}
                className="inline-flex items-center justify-center rounded-sm bg-primary px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send enquiry"}
              </button>
            </form>
          )}
        </div>
      </Section>
    </>
  );
}
