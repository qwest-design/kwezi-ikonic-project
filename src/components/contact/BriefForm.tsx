"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { motion, prefersReducedMotion } from "@/lib/motion";
import { BUDGETS, NEEDS, TIMINGS, checkStep, emptyBrief, type BriefDraft } from "@/lib/brief";
import { Button } from "@/components/ui/Button";
import { sealActions } from "@/components/three/sealStore";
import { sendBrief } from "@/app/contact/actions";
import { contactPage } from "@/content/pages";

const STEPS = ["What do you need?", "Tell us about you and the project.", "When, and roughly what budget?", "How do we reach you?"];
const LAST = STEPS.length - 1;

const chip =
  "type-label inline-flex min-h-11 cursor-pointer items-center rounded-full border border-bone/25 px-s2 text-bone/80 select-none " +
  "transition-[background-color,color,border-color] duration-(--duration-ui) hover:border-bone hover:text-bone " +
  "peer-checked:border-bone peer-checked:bg-bone peer-checked:text-ink " +
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-signal";

const field =
  "w-full border-0 border-b border-bone/25 bg-transparent px-0 py-s2 text-body text-bone placeholder:text-mist/70 " +
  "transition-[border-color] duration-(--duration-ui) focus:border-signal focus:outline-none aria-invalid:border-signal";

/**
 * The four-step project brief. One question per screen with a progress bar.
 * Each step is checked before moving on; answers stay in state, so going back
 * (or a failed send) never loses them. The server validates everything again.
 */
export function BriefForm() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BriefDraft>(emptyBrief);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const direction = useRef(1);
  const moved = useRef(false);

  const set = <K extends keyof BriefDraft>(key: K, value: BriefDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key])
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
  };

  const toggleNeed = (need: string) =>
    set("needs", draft.needs.includes(need) ? draft.needs.filter((n) => n !== need) : [...draft.needs, need]);

  // New step: slide it in and move focus to its question, so screen readers hear it.
  useLayoutEffect(() => {
    if (!moved.current || !panel.current) return;
    const reduced = prefersReducedMotion();
    const tween = gsap.fromTo(
      panel.current,
      { opacity: 0, x: reduced ? 0 : 40 * direction.current },
      { opacity: 1, x: 0, duration: reduced ? motion.reduced.duration : 0.6, ease: motion.entrance.ease, clearProps: "transform" },
    );
    heading.current?.focus({ preventScroll: true });
    return () => {
      tween.progress(1).kill();
    };
  }, [step, done]);

  useEffect(() => {
    if (!done) return;
    sealActions.setPose({ x: 0.3, y: -0.3, scale: 0.45, mobile: { x: 0, y: -0.28, scale: 0.45 } });
    const id = setTimeout(() => sealActions.stamp(), 500);
    return () => clearTimeout(id);
  }, [done]);

  const go = (next: number) => {
    direction.current = next > step ? 1 : -1;
    moved.current = true;
    setStep(next);
  };

  const focusFirstError = (errs: Record<string, string>) => {
    requestAnimationFrame(() => {
      const first = Object.keys(errs)[0];
      panel.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = checkStep(step, draft);
    if (errs) {
      setErrors(errs);
      focusFirstError(errs);
      return;
    }
    setErrors({});
    if (step < LAST) return go(step + 1);

    // Final step: send. The honeypot is read straight from the form.
    const honeypot = String(new FormData(e.currentTarget).get("website") ?? "");
    setFailed(false);
    startTransition(async () => {
      const result = await sendBrief(draft, honeypot).catch(() => ({ ok: false as const, reason: "failed" as const }));
      if (result.ok) {
        moved.current = true;
        direction.current = 1;
        setDone(true);
      } else if (result.reason === "invalid") {
        // The server disagreed with the client checks: send them back to the first bad step.
        for (let s = 0; s <= LAST; s++) {
          const errs = checkStep(s, draft);
          if (errs) {
            setErrors(errs);
            go(s);
            return;
          }
        }
        setFailed(true);
      } else {
        setFailed(true);
      }
    });
  };

  if (done) {
    return (
      <div ref={panel} className="flex flex-col items-start gap-s4">
        <h2 ref={heading} tabIndex={-1} className="font-display-tight text-h2 outline-none">
          Got it. We’ll be in touch within <span className="font-accent-italic">{contactPage.responseTime}</span>.
        </h2>
        <Button href="/work" variant="secondary">
          See the work
        </Button>
      </div>
    );
  }

  const err = (name: string) =>
    errors[name] ? (
      <p id={`${name}-error`} className="type-label pt-s1 text-signal">
        {errors[name]}
      </p>
    ) : null;
  const a11y = (name: string) => ({
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form noValidate onSubmit={onSubmit} aria-label="Project brief" className="flex flex-col gap-s5">
      <div className="flex flex-col gap-s2">
        <p className="type-label text-mist" aria-live="polite">
          Step {step + 1} of {STEPS.length}
        </p>
        <div className="relative h-px w-full bg-bone/20" aria-hidden="true">
          <span
            className="absolute inset-0 origin-left bg-signal transition-transform duration-(--duration-ui) ease-expo-out"
            style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }}
          />
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div ref={panel} className="flex min-h-[22rem] flex-col gap-s4">
        <h2 ref={heading} tabIndex={-1} className="font-display-tight text-h3 outline-none">
          {STEPS[step]}
        </h2>

        {step === 0 && (
          <fieldset {...{ "aria-describedby": errors.needs ? "needs-error" : undefined }}>
            <legend className="sr-only">What do you need? Pick all that apply.</legend>
            <div className="flex flex-wrap gap-s1">
              {NEEDS.map((n) => (
                <label key={n}>
                  <input type="checkbox" name="needs" className="peer sr-only" checked={draft.needs.includes(n)} onChange={() => toggleNeed(n)} />
                  <span className={chip}>{n}</span>
                </label>
              ))}
            </div>
            {err("needs")}
          </fieldset>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-s3">
            <Field label="Your name" error={err("name")}>
              <input type="text" autoComplete="name" className={field} value={draft.name} onChange={(e) => set("name", e.target.value)} {...a11y("name")} />
            </Field>
            <Field label="Company (optional)" error={err("company")}>
              <input type="text" autoComplete="organization" className={field} value={draft.company} onChange={(e) => set("company", e.target.value)} {...a11y("company")} />
            </Field>
            <Field label="The project" error={err("description")}>
              <textarea
                rows={5}
                className={`${field} resize-y`}
                placeholder="What are you making, and what should it do for the business?"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                {...a11y("description")}
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-s4">
            <ChipGroup legend="Timing" name="timing" options={TIMINGS} value={draft.timing} onChange={(v) => set("timing", v)} error={err("timing")} />
            <ChipGroup legend="Budget (rand, excluding VAT)" name="budget" options={BUDGETS} value={draft.budget} onChange={(v) => set("budget", v)} error={err("budget")} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-s3">
            <Field label="Email" error={err("email")}>
              <input type="email" autoComplete="email" inputMode="email" className={field} value={draft.email} onChange={(e) => set("email", e.target.value)} {...a11y("email")} />
            </Field>
            <Field label="Phone (optional)" error={err("phone")}>
              <input type="tel" autoComplete="tel" inputMode="tel" className={field} value={draft.phone} onChange={(e) => set("phone", e.target.value)} {...a11y("phone")} />
            </Field>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-s2">
        {step > 0 && (
          <Button variant="secondary" onClick={() => go(step - 1)} disabled={pending}>
            Back
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {step < LAST ? "Next" : pending ? "Sending…" : "Send brief"}
        </Button>
      </div>
      {failed && (
        <p role="alert" className="max-w-[48ch] text-body text-signal">
          {contactPage.failure}
        </p>
      )}
    </form>
  );
}

function Field({ label, error, children }: { label: string; error: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col">
      <span className="type-label text-mist">{label}</span>
      {children}
      {error}
    </label>
  );
}

function ChipGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  error: ReactNode;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="type-label pb-s2 text-mist">{legend}</legend>
      <div className="flex flex-wrap gap-s1">
        {options.map((o) => (
          <label key={o}>
            <input type="radio" name={name} value={o} className="peer sr-only" checked={value === o} onChange={() => onChange(o)} />
            <span className={chip}>{o}</span>
          </label>
        ))}
      </div>
      {error}
    </fieldset>
  );
}
