/**
 * Copy for /capabilities, /studio and /contact. Typed local data until a CMS arrives.
 * Anything containing [TO SUPPLY] is waiting on Kwezi's copy, people or links.
 */

import { capabilities as homeCapabilities } from "./home";

const TS = "[TO SUPPLY]";

/* ---------------------------------- Capabilities --------------------------------- */

export type Discipline = {
  index: string;
  title: string;
  /** Large headline for the discipline's section. */
  headline: string;
  /** What it's for: one short paragraph. */
  purpose: string;
  deliverables: string[];
};

export const capabilitiesPage = {
  title: "Four disciplines. One standard.",
  intro: `${TS} Intro paragraph for the capabilities page.`,
  disciplines: homeCapabilities.cards.map<Discipline>((c) => ({
    index: c.index,
    title: c.title,
    headline: c.tagline,
    purpose: `${TS} What ${c.title.toLowerCase()} is for: the problem it solves and what the client walks away with.`,
    deliverables: [1, 2, 3, 4, 5].map((n) => `${TS} ${c.title} deliverable ${n}`),
  })),
  process: {
    title: "The Four Ds",
    steps: [
      { name: "Diagnose", line: `${TS} One line on what happens in Diagnose.` },
      { name: "Define", line: `${TS} One line on what happens in Define.` },
      { name: "Design", line: `${TS} One line on what happens in Design.` },
      { name: "Deploy", line: `${TS} One line on what happens in Deploy.` },
    ],
  },
  cta: { label: "Start a project", href: "/contact" },
};

/* ------------------------------------- Studio ------------------------------------ */

export type TeamMember = { name: string; role: string; portrait: string };

export const studioPage = {
  title: "Normal people. Unreasonable standards.",
  intro: `${TS} Intro paragraph about the studio: who you are, where you work, how you work.`,
  beliefsTitle: "What we believe",
  beliefs: [1, 2, 3, 4].map((n) => `${TS} Belief statement ${n}.`),
  teamTitle: "The team",
  team: [1, 2, 3, 4, 5, 6].map<TeamMember>((n) => ({
    name: `${TS} Name ${n}`,
    role: `${TS} Role`,
    portrait: `/team/placeholder-0${n}.svg`,
  })),
  clientsTitle: "Clients",
};

/* ------------------------------------- Contact ----------------------------------- */

export const contactDetails = {
  emails: ["hello@ikonicdesigns.co.za", "kwezi@ikonicdesigns.co.za"],
  phone: { display: "+27 72 144 0565", tel: "+27721440565" },
};

export const contactPage = {
  title: "Let's make something worth remembering.",
  /** Shown on the success screen: "We'll be in touch within ___." */
  responseTime: "one working day",
  failure: "Something went wrong. Please try again, or email hello@ikonicdesigns.co.za directly.",
};
