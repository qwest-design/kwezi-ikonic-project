"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { briefSchema, type Brief, type SendResult } from "@/lib/brief";
import { isTestTransport, recordEmail, type OutboxEmail } from "@/lib/testOutbox";

const FROM = "Ikonic website <website@ikonicdesigns.co.za>";
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

/**
 * Sends per IP in the last hour. In memory, so it is per server instance and resets
 * on a cold start: enough to stop casual abuse. A shared store (for example Upstash
 * Redis) would make it exact across instances.
 */
const sends = new Map<string, number[]>();

function allow(ip: string) {
  const now = Date.now();
  const recent = (sends.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    sends.set(ip, recent);
    return false;
  }
  recent.push(now);
  sends.set(ip, recent);
  // Keep the map from growing without bound.
  if (sends.size > 5000) for (const [key, times] of sends) if (times.every((t) => now - t >= WINDOW_MS)) sends.delete(key);
  return true;
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function rows(brief: Brief): [string, string][] {
  return [
    ["What they need", brief.needs.join(", ")],
    ["Name", brief.name],
    ["Company", brief.company || "Not given"],
    ["Project", brief.description],
    ["Timing", brief.timing],
    ["Budget", brief.budget],
    ["Email", brief.email],
    ["Phone", brief.phone || "Not given"],
  ];
}

/**
 * Validates the whole brief again with zod, drops honeypot submissions silently,
 * rate-limits by IP, then emails the brief with Resend. The recipient comes only
 * from the CONTACT_TO env var; nothing from the browser decides where mail goes.
 */
export async function sendBrief(input: unknown, honeypot: string): Promise<SendResult> {
  // Bots fill every field. Pretend it worked so they don't retry.
  if (honeypot) return { ok: true };

  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const brief = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!allow(ip)) return { ok: false, reason: "rate-limited" };

  const to = process.env.CONTACT_TO;
  const key = process.env.RESEND_API_KEY;
  const testMode = isTestTransport();
  if (!to || (!key && !testMode)) {
    console.error("Contact form: CONTACT_TO or RESEND_API_KEY is not set.");
    return { ok: false, reason: "failed" };
  }

  const subject = `New project brief: ${brief.name}${brief.company ? `, ${brief.company}` : ""}`;
  const list = rows(brief);
  const text = list.map(([k, v]) => `${k}:\n${v}`).join("\n\n");
  const html =
    `<h1 style="font:600 20px sans-serif">${escape(subject)}</h1>` +
    list
      .map(
        ([k, v]) =>
          `<p style="font:14px/1.5 sans-serif;margin:0 0 16px"><strong>${escape(k)}</strong><br>${escape(v).replace(/\n/g, "<br>")}</p>`,
      )
      .join("");
  const email: OutboxEmail = { from: FROM, to: [to], replyTo: brief.email, subject, text, html };

  // Test mode: record instead of sending (see src/lib/testOutbox.ts).
  if (testMode) {
    recordEmail(email);
    return { ok: true };
  }

  try {
    const { error } = await new Resend(key).emails.send(email);
    if (error) {
      console.error("Contact form: Resend rejected the email.", error.name, error.message);
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  } catch (err) {
    console.error("Contact form: sending failed.", err);
    return { ok: false, reason: "failed" };
  }
}
