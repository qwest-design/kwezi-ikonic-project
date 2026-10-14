import { cacheLife, cacheTag } from "next/cache";
import { DISCIPLINES, caseStudies as localCaseStudies, type CaseStudy, type Discipline, type Media } from "@/content/work";
import { clients as localClients, proof as localProof, type Stat } from "@/content/home";
import { studioPage, type TeamMember } from "@/content/pages";

/**
 * Content source. With WORDPRESS_GRAPHQL_URL set, everything comes from headless
 * WordPress through WPGraphQL (plain fetch, no client library). Without it, the typed
 * local files in src/content are used, so local development needs no CMS.
 *
 * Every getter is cached indefinitely ("use cache" + cacheLife("max")) and tagged, so
 * pages are statically generated and only rebuilt when WordPress calls
 * /api/revalidate with the matching tag (see src/app/api/revalidate/route.ts).
 */

export const CONTENT_TAGS = ["projects", "clients", "team", "settings"] as const;
export type ContentTag = (typeof CONTENT_TAGS)[number];

export type ClientLogo = { name: string; logo: string; href?: string };

const endpoint = () => process.env.WORDPRESS_GRAPHQL_URL?.trim() || "";

async function wp<T>(query: string): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  // Optional: an application password for private fields ("user:app-password").
  if (process.env.WORDPRESS_AUTH) headers.authorization = `Basic ${Buffer.from(process.env.WORDPRESS_AUTH).toString("base64")}`;
  const res = await fetch(endpoint(), { method: "POST", headers, body: JSON.stringify({ query }) });
  if (!res.ok) throw new Error(`WordPress GraphQL responded ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`WordPress GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
  if (!json.data) throw new Error("WordPress GraphQL returned no data");
  return json.data;
}

/* ------------------------------------- Shapes ------------------------------------ */
// Field names follow the ACF field groups described in wordpress/README.md.

type WpImage = { node: { sourceUrl: string; altText?: string; mediaDetails?: { width?: number; height?: number } } } | null;
type WpGallery = { nodes: NonNullable<WpImage>["node"][] } | null;
type WpRefs = { nodes: { slug: string }[] } | null;

const media = (img: NonNullable<WpImage>["node"] | undefined, fallback: Media): Media =>
  img?.sourceUrl
    ? {
        src: img.sourceUrl,
        alt: img.altText || fallback.alt,
        width: img.mediaDetails?.width || fallback.width,
        height: img.mediaDetails?.height || fallback.height,
      }
    : fallback;

const PROJECTS = /* GraphQL */ `
  query IkonicProjects {
    projects(first: 100, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
      nodes {
        slug
        title
        projectFields {
          client
          year
          disciplines
          summary
          challenge
          ideaLine
          ideaBody
          hero { node { sourceUrl altText mediaDetails { width height } } }
          craftMedia { nodes { sourceUrl altText mediaDetails { width height } } }
          craftCaption
          results { value label }
          quote { text name role }
          nextProject { nodes { slug } }
        }
      }
    }
  }
`;

type WpProject = {
  slug: string;
  title: string;
  projectFields: {
    client?: string;
    year?: string;
    disciplines?: string[];
    summary?: string;
    challenge?: string;
    ideaLine?: string;
    ideaBody?: string;
    hero?: WpImage;
    craftMedia?: WpGallery;
    craftCaption?: string;
    results?: { value: string; label: string }[] | null;
    quote?: { text?: string; name?: string; role?: string } | null;
    nextProject?: WpRefs;
  } | null;
};

/** Placeholder imagery for anything WordPress leaves empty. */
const blank = (label: string, width: number, height: number): Media => ({ src: `/work/project-03/${label}.svg`, alt: "", width, height });

function toCaseStudy(p: WpProject): CaseStudy {
  const f = p.projectFields ?? {};
  const hero = media(f.hero?.node, blank("hero", 1920, 1080));
  // Craft media list, in order: lead image, spread back, spread middle, spread front, closing image.
  const craft = f.craftMedia?.nodes ?? [];
  return {
    slug: p.slug,
    title: p.title,
    client: f.client ?? "",
    year: f.year ?? "",
    disciplines: (f.disciplines ?? []).filter((d): d is Discipline => (DISCIPLINES as readonly string[]).includes(d)),
    summary: f.summary ?? "",
    hero,
    challenge: f.challenge ?? "",
    idea: { line: f.ideaLine ?? "", body: f.ideaBody ?? "" },
    craft: {
      lead: media(craft[0], hero),
      spread: {
        back: media(craft[1], blank("layer-back", 1600, 1000)),
        mid: media(craft[2], blank("layer-mid", 900, 1125)),
        front: media(craft[3], blank("layer-front", 700, 700)),
      },
      close: media(craft[4], hero),
      caption: f.craftCaption || undefined,
    },
    impact: (f.results ?? []).filter((r) => r.value && r.label).slice(0, 4),
    quote: f.quote?.text ? { text: f.quote.text, name: f.quote.name ?? "", role: f.quote.role ?? "" } : undefined,
    next: f.nextProject?.nodes?.[0]?.slug,
  };
}

/* ------------------------------------- Getters ----------------------------------- */

export async function getCaseStudies(): Promise<CaseStudy[]> {
  "use cache";
  cacheLife("max");
  cacheTag("projects");
  if (!endpoint()) return localCaseStudies;
  const data = await wp<{ projects: { nodes: WpProject[] } }>(PROJECTS);
  return data.projects.nodes.map(toCaseStudy);
}

export async function getCaseStudy(slug: string) {
  return (await getCaseStudies()).find((p) => p.slug === slug);
}

/** The project's chosen "next project", or the one after it in order (wrapping round). */
export async function getNextCaseStudy(slug: string) {
  const all = await getCaseStudies();
  const i = all.findIndex((p) => p.slug === slug);
  const chosen = all[i]?.next && all.find((p) => p.slug === all[i].next && p.slug !== slug);
  return chosen || all[(i + 1) % all.length];
}

export async function getClients(): Promise<ClientLogo[]> {
  "use cache";
  cacheLife("max");
  cacheTag("clients", "projects");
  const studies = await getCaseStudies();
  const href = (slug?: string) => (slug && studies.some((p) => p.slug === slug) ? `/work/${slug}` : undefined);

  if (!endpoint()) return localClients.logos.map((c) => ({ name: c.name, logo: c.logo, href: href(c.caseStudy) }));
  const data = await wp<{
    clients: { nodes: { title: string; clientFields: { logo?: WpImage; caseStudy?: WpRefs } | null }[] };
  }>(/* GraphQL */ `
    query IkonicClients {
      clients(first: 100, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes { title clientFields { logo { node { sourceUrl } } caseStudy { nodes { slug } } } }
      }
    }
  `);
  return data.clients.nodes
    .filter((c) => c.clientFields?.logo?.node?.sourceUrl)
    .map((c) => ({ name: c.title, logo: c.clientFields!.logo!.node.sourceUrl, href: href(c.clientFields?.caseStudy?.nodes?.[0]?.slug) }));
}

export async function getTeam(): Promise<TeamMember[]> {
  "use cache";
  cacheLife("max");
  cacheTag("team");
  if (!endpoint()) return studioPage.team;
  const data = await wp<{
    teamMembers: { nodes: { title: string; teamMemberFields: { role?: string; portrait?: WpImage } | null }[] };
  }>(/* GraphQL */ `
    query IkonicTeam {
      teamMembers(first: 100, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes { title teamMemberFields { role portrait { node { sourceUrl } } } }
      }
    }
  `);
  return data.teamMembers.nodes
    .filter((m) => m.teamMemberFields?.portrait?.node?.sourceUrl)
    .map((m) => ({ name: m.title, role: m.teamMemberFields?.role ?? "", portrait: m.teamMemberFields!.portrait!.node.sourceUrl }));
}

/** Proof numbers for the Home page. Empty hides the section. */
export async function getProof(): Promise<Stat[]> {
  "use cache";
  cacheLife("max");
  cacheTag("settings");
  if (!endpoint()) return localProof;
  const data = await wp<{
    ikonicSettings: { settingsFields: { proof?: { value?: number | string; prefix?: string; suffix?: string; label?: string }[] | null } | null } | null;
  }>(/* GraphQL */ `
    query IkonicSettings {
      ikonicSettings { settingsFields { proof { value prefix suffix label } } }
    }
  `);
  return (data.ikonicSettings?.settingsFields?.proof ?? [])
    .map((s) => ({ value: Number(s.value), prefix: s.prefix || undefined, suffix: s.suffix || undefined, label: s.label ?? "" }))
    .filter((s) => Number.isFinite(s.value) && s.label);
}
