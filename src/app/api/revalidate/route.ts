import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { CONTENT_TAGS, type ContentTag } from "@/lib/content";

/**
 * On-demand revalidation. WordPress calls this when content changes (see
 * wordpress/ikonic-revalidate.php):
 *
 *   POST /api/revalidate
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "tags": ["projects"] }
 *
 * Each tag expires the cached content behind it, so the next visit rebuilds the
 * affected pages with fresh data. No tags means everything.
 */

function secretMatches(given: string | null) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  await connection();
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ revalidated: false, error: "Unauthorised" }, { status: 401 });
  }

  let requested: unknown = [];
  try {
    requested = ((await request.json()) as { tags?: unknown }).tags ?? [];
  } catch {
    // An empty or non-JSON body revalidates everything.
  }
  const list = Array.isArray(requested) ? requested : [requested];
  const tags = (list.length ? list : CONTENT_TAGS).filter((t): t is ContentTag => CONTENT_TAGS.includes(t as ContentTag));
  if (!tags.length) return Response.json({ revalidated: false, error: `Unknown tags. Use: ${CONTENT_TAGS.join(", ")}` }, { status: 400 });

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true, tags });
}
