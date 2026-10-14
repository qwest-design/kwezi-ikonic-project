import { expect, test } from "@playwright/test";
import { skipIntro } from "./helpers";

/**
 * Submits the contact brief against the test transport and checks the email the
 * server built: fixed recipient, the client's reply-to, the subject, every answer.
 */
test("contact brief builds the right email", async ({ page, request }) => {
  await skipIntro(page);
  const email = `test+${Date.now()}@example.com`;
  await page.goto("/contact");

  await page.getByText("Identity", { exact: true }).click();
  await page.getByText("Website", { exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Your name").fill("Test Person");
  await page.getByLabel("Company (optional)").fill("Acme");
  await page.getByLabel("The project").fill("A new identity and website for a product launch next year.");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByText("Within 1 to 3 months", { exact: true }).click();
  await page.getByText("R50k to R150k", { exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone (optional)").fill("+27 72 000 0000");
  await page.getByRole("button", { name: "Send brief" }).click();

  await expect(page.getByRole("heading", { level: 2 }).first()).toContainText("Got it. We’ll be in touch within", { timeout: 20000 });
  await expect(page.getByRole("link", { name: "See the work" })).toHaveAttribute("href", "/work");

  const outbox = await (await request.get("/api/test-outbox")).json();
  const sent = outbox.find((m: { replyTo: string }) => m.replyTo === email);
  expect(sent, "no email recorded for this submission").toBeTruthy();
  expect(sent.to).toEqual(["hello@ikonicdesigns.co.za"]);
  expect(sent.replyTo).toBe(email);
  expect(sent.from).toContain("website@ikonicdesigns.co.za");
  expect(sent.subject).toBe("New project brief: Test Person, Acme");
  for (const answer of ["Identity, Website", "Test Person", "Acme", "product launch", "Within 1 to 3 months", "R50k to R150k", email, "+27 72 000 0000"]) {
    expect(sent.text).toContain(answer);
  }
});

