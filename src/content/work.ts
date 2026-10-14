/**
 * Work and case study content. Typed local data until a CMS arrives.
 * Anything containing [TO SUPPLY] is stand-in copy, imagery or data waiting on Kwezi.
 * The Gardens and Door are the two sample case studies; Project 03 to 05 keep the
 * Home page's selected work at five cards until real projects replace them.
 */

export const DISCIPLINES = ["Strategy", "Identity", "Digital", "Motion"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export type Media = { src: string; alt: string; width: number; height: number };

export type Result = {
  /** Shown in large mono numerals, so keep it short: "+38%", "3.2x", "R12m". */
  value: string;
  label: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  client: string;
  year: string;
  disciplines: Discipline[];
  /** One line for cards and list rows. */
  summary: string;
  hero: Media;
  challenge: string;
  idea: { line: string; body: string };
  craft: {
    /** Full-bleed image before the spread. */
    lead: Media;
    /** Three layers moving at 0.6x, 0.85x and 1.15x of scroll. */
    spread: { back: Media; mid: Media; front: Media };
    /** Full-bleed image after the spread. */
    close: Media;
    caption?: string;
  };
  /** Two to four results. */
  impact: Result[];
  quote?: { text: string; name: string; role: string };
  /** Slug of the project the "Next project" panel shows. Defaults to the next in order. */
  next?: string;
};

const TS = "[TO SUPPLY]";

const media = (slug: string, title: string) => {
  const m = (file: string, label: string, width: number, height: number): Media => ({
    src: `/work/${slug}/${file}.svg`,
    alt: `${TS} ${title}: ${label}`,
    width,
    height,
  });
  return {
    hero: m("hero", "hero image", 1920, 1080),
    lead: m("craft-1", "full-bleed craft image", 1920, 1080),
    back: m("layer-back", "spread, back layer", 1600, 1000),
    mid: m("layer-mid", "spread, middle layer", 900, 1125),
    front: m("layer-front", "spread, front layer", 700, 700),
    close: m("craft-2", "closing craft image", 1920, 1200),
  };
};

function caseStudy(
  slug: string,
  title: string,
  disciplines: Discipline[],
  extra: Partial<Pick<CaseStudy, "summary" | "challenge" | "idea" | "impact" | "quote">> = {},
): CaseStudy {
  const m = media(slug, title);
  return {
    slug,
    title,
    client: `Client ${TS}`,
    year: TS,
    disciplines,
    summary: `${TS} One-line summary of the result.`,
    hero: m.hero,
    challenge: `${TS} The challenge: two or three sentences on where the client was, what was in the way, and why it mattered to the business.`,
    idea: {
      line: `${TS} The idea, in one line.`,
      body: `${TS} A paragraph on how the idea answers the challenge and how it shaped every decision that followed.`,
    },
    craft: { lead: m.lead, spread: { back: m.back, mid: m.mid, front: m.front }, close: m.close, caption: `${TS} Caption for the craft spread.` },
    impact: [
      { value: "00%", label: `${TS} Result one` },
      { value: "0.0x", label: `${TS} Result two` },
      { value: "000", label: `${TS} Result three` },
    ],
    ...extra,
  };
}

export const caseStudies: CaseStudy[] = [
  caseStudy("the-gardens", "The Gardens", ["Strategy", "Identity", "Digital"], {
    summary: `${TS} One-line result for The Gardens.`,
    challenge: `${TS} The Gardens challenge: where the brand stood, what was holding it back, and what the business needed it to do.`,
    idea: {
      line: `${TS} The Gardens idea, set large in one line.`,
      body: `${TS} How the idea for The Gardens came to life across strategy, identity and the website.`,
    },
    impact: [
      { value: "00%", label: `${TS} Growth metric` },
      { value: "0.0x", label: `${TS} Engagement metric` },
      { value: "000k", label: `${TS} Reach metric` },
    ],
    quote: { text: `${TS} A short client quote about working with Ikonic and what changed.`, name: TS, role: `Role, The Gardens ${TS}` },
  }),
  caseStudy("door", "Door", ["Identity", "Motion"], {
    summary: `${TS} One-line result for Door.`,
    challenge: `${TS} The Door challenge: the moment the brand was in and the problem worth solving.`,
    idea: {
      line: `${TS} The Door idea, set large in one line.`,
      body: `${TS} How the idea for Door carried through the identity and the motion system.`,
    },
    impact: [
      { value: "00%", label: `${TS} Recognition metric` },
      { value: "0.0x", label: `${TS} Conversion metric` },
    ],
  }),
  caseStudy("project-03", "Project 03", ["Digital"]),
  caseStudy("project-04", "Project 04", ["Motion", "Identity"]),
  caseStudy("project-05", "Project 05", ["Strategy", "Digital"]),
];

export const workIndex = {
  title: "Proof, not promises.",
  /** [TO SUPPLY]: Kwezi will paste the intro. */
  intro: `${TS} Intro paragraph for the work page.`,
};

export function getCaseStudy(slug: string) {
  return caseStudies.find((p) => p.slug === slug);
}

/** The project after this one, wrapping round to the first. */
export function getNextCaseStudy(slug: string) {
  const i = caseStudies.findIndex((p) => p.slug === slug);
  return caseStudies[(i + 1) % caseStudies.length];
}
