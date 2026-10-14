import { connection } from "next/server";
import { isTestTransport, readOutbox } from "@/lib/testOutbox";

/** Test mode only: the emails the contact form would have sent. 404 otherwise. */
export async function GET() {
  await connection();
  if (!isTestTransport()) return new Response("Not found", { status: 404 });
  return Response.json(readOutbox());
}
