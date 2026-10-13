import { z } from "zod";

/**
 * The contact brief: one schema per step, shared by the form (step-by-step checks)
 * and the server action (which validates everything again before sending).
 */

export const NEEDS = ["Strategy", "Identity", "Website", "Motion", "Not sure yet"] as const;

export const TIMINGS = ["As soon as possible", "Within 1 to 3 months", "In 3 to 6 months", "Flexible"] as const;

/** Budget ranges in rand. Assumed bands: confirm or replace. */
export const BUDGETS = ["Under R50k", "R50k to R150k", "R150k to R350k", "R350k to R750k", "R750k+", "Not sure yet"] as const;

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);

export const stepSchemas = [
  z.object({
    needs: z.array(z.enum(NEEDS)).min(1, "Pick at least one."),
  }),
  z.object({
    name: text(120).min(2, "Please tell us your name."),
    company: text(160),
    description: text(4000).min(20, "Tell us a little more: at least a couple of sentences."),
  }),
  z.object({
    timing: z.enum(TIMINGS, { error: "Pick a timeframe." }),
    budget: z.enum(BUDGETS, { error: "Pick a budget range." }),
  }),
  z.object({
    email: z.email("Please enter a valid email address.").max(254),
    phone: text(40)
      .refine((v) => v === "" || /^[+()\d\s-]{7,}$/.test(v), "Please enter a valid phone number, or leave it blank."),
  }),
] as const;

export const briefSchema = stepSchemas[0].extend(stepSchemas[1].shape).extend(stepSchemas[2].shape).extend(stepSchemas[3].shape);

export type Brief = z.infer<typeof briefSchema>;

/** Answers as the form holds them (selects may still be empty). */
export type BriefDraft = {
  needs: string[];
  name: string;
  company: string;
  description: string;
  timing: string;
  budget: string;
  email: string;
  phone: string;
};

export const emptyBrief: BriefDraft = {
  needs: [],
  name: "",
  company: "",
  description: "",
  timing: "",
  budget: "",
  email: "",
  phone: "",
};

/** Field-level messages for one step, or null when the step is valid. */
export function checkStep(step: number, draft: BriefDraft): Record<string, string> | null {
  const result = stepSchemas[step].safeParse(draft);
  if (result.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export type SendResult = { ok: true } | { ok: false; reason: "invalid" | "rate-limited" | "failed" };
