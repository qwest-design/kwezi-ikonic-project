/**
 * Home page content. Typed local data until a CMS arrives.
 * Anything marked PLACEHOLDER is stand-in copy or data waiting on Kwezi.
 */

import { caseStudies } from "./work";

export type Capability = {
  index: string;
  title: string;
  tagline: string;
  /** One-sentence promise. PLACEHOLDER until the real lines are pasted in. */
  promise: string;
};

export type HomeProject = {
  slug: string;
  name: string;
  client: string;
  tags: string[];
  result: string;
  image: string;
  imageAlt: string;
};

export type Stat = { value: number; prefix?: string; suffix?: string; label: string };

export type Client = {
  name: string;
  logo: string;
  /** Slug of this client's case study, if there is one. Logos without one aren't links. */
  caseStudy?: string;
};

/** Case study link for a client logo, only when that case study exists. */
export const clientHref = (c: Client) =>
  c.caseStudy && caseStudies.some((p) => p.slug === c.caseStudy) ? `/work/${c.caseStudy}` : undefined;

export const hero = {
  headline: { before: "We make brands people ", accent: "remember", after: "." },
  sub: "Ikonic is a South African brand and digital studio. We shape strategy, identity, websites and motion that earn their place in people’s minds and move the business behind them.",
  primary: { label: "See the work", href: "/work" },
  secondary: { label: "Start a project", href: "/contact" },
  scrollCue: "Scroll to earn it",
};

export const manifesto = [
  "An icon isn’t designed. It’s earned.",
  "It’s the mark you recognise from across the street, the site that feels right on the first click, the film you still remember a year later.",
  "That’s the bar. We only stamp work Ikonic when it grows the business behind it.",
];

const PROMISE_PLACEHOLDER = "One-sentence promise to come.";

export const capabilities: { title: string; cards: Capability[]; link: { label: string; href: string } } = {
  title: "What we do",
  cards: [
    { index: "01", title: "Strategy", tagline: "Find the truth worth building on.", promise: PROMISE_PLACEHOLDER },
    { index: "02", title: "Identity", tagline: "Give it a face, a voice, a sound.", promise: PROMISE_PLACEHOLDER },
    { index: "03", title: "Digital", tagline: "Trusted on the first click.", promise: PROMISE_PLACEHOLDER },
    { index: "04", title: "Motion", tagline: "Make it move. Make it stick.", promise: PROMISE_PLACEHOLDER },
  ],
  link: { label: "Explore capabilities", href: "/capabilities" },
};

/** Selected work comes from the case studies in src/content/work.ts. */
export const selectedWork: { title: string; projects: HomeProject[]; allLink: { label: string; href: string } } = {
  title: "Work that earned the stamp.",
  projects: caseStudies.map((p) => ({
    slug: p.slug,
    name: p.title,
    client: p.client,
    tags: p.disciplines,
    result: p.summary,
    image: p.hero.src,
    imageAlt: p.hero.alt,
  })),
  allLink: { label: "See all work", href: "/work" },
};

/** Proof numbers. Leave empty to hide the section; no figures have been supplied yet. */
export const proof: Stat[] = [];

/** PLACEHOLDER client logos. Swap in real names and logo files (SVG, full colour). */
export const clients: { title: string; logos: Client[] } = {
  title: "Trusted by the institutions South Africa runs on.",
  logos: Array.from({ length: 10 }, (_, i) => ({
    name: `Client ${String(i + 1).padStart(2, "0")}`,
    logo: `/clients/placeholder-${String(i + 1).padStart(2, "0")}.svg`,
  })),
};

export const closing = {
  headline: { before: "Got something worth making ", accent: "iconic", after: "?" },
  /** PLACEHOLDER: no sub copy supplied yet. */
  sub: "Sub line to come.",
  cta: { label: "Start a project", href: "/contact" },
};
