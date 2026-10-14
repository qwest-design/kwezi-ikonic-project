/**
 * Test-mode outbox. With CONTACT_TRANSPORT=test the contact action records the
 * email it would have sent here instead of calling Resend, and /api/test-outbox
 * returns it, so end-to-end tests can check the payload. Never set in production.
 */
export type OutboxEmail = { from: string; to: string[]; replyTo: string; subject: string; text: string; html: string };

const store = globalThis as typeof globalThis & { __ikonicOutbox?: OutboxEmail[] };

export const isTestTransport = () => process.env.CONTACT_TRANSPORT === "test";

export function recordEmail(email: OutboxEmail) {
  (store.__ikonicOutbox ??= []).push(email);
}

export function readOutbox() {
  return store.__ikonicOutbox ?? [];
}
