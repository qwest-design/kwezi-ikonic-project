// FOOTER DESIGN IS LOCKED. ONLY LINKS MAY CHANGE.
//
// Mirrors the footer on the live site (ikonicdesigns.co.za): copyright, Pages,
// Social media, Services and Contact columns, then the logo and the credit line,
// in that order. Layout and styling follow the live footer; only destinations and
// the copyright year, Studio, Capabilities and TikTok changes are new.

import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { socialLinks } from "@/content/social";

/**
 * The live footer logo (Ikonic_000.png). Set to "/brand/Ikonic_000.png" once the
 * file is in /public/brand; until then the text wordmark stands in.
 */
const FOOTER_LOGO: { src: string; width: number; height: number } | null = null;

const pages = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Studio", href: "/studio" },
  { label: "Contact", href: "/contact" },
];

const services = [
  { label: "Design", href: "/capabilities#identity" },
  { label: "Branding", href: "/capabilities#strategy" },
  { label: "Web services", href: "/capabilities#digital" },
  { label: "Motion graphics", href: "/capabilities#motion" },
];

const contact = [
  { label: "+27 72 1440 565", href: "tel:+27721440565" },
  { label: "hello@ikonicdesigns.co.za", href: "mailto:hello@ikonicdesigns.co.za" },
  { label: "kwezi@ikonicdesigns.co.za", href: "mailto:kwezi@ikonicdesigns.co.za" },
];

/** The live footer's own spelling of each network. */
const socialText = { facebook: "Facebook", instagram: "Instagram", twitter: "Twitter", linkedin: "Linkedin", tiktok: "TikTok" };

const linkClass =
  "text-bone/70 transition-colors duration-(--duration-ui) hover:text-bone " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-s2">
      <h2 className="text-body font-semibold text-bone">{title}</h2>
      <ul className="flex flex-col gap-s1 text-body">{children}</ul>
    </nav>
  );
}

/** new Date().getFullYear(), cached for a day so pages can still be prerendered. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const year = await currentYear();

  return (
    <footer className="relative z-10 border-t border-bone/10 bg-ink">
      <div className="grid-site gap-y-s5 py-s6">
        <div className="col-span-full flex flex-col gap-s1 text-body md:col-span-4 lg:col-span-3">
          <p>
            <strong className="font-semibold text-bone">Copyright © Universe Ikonic.</strong>
          </p>
          <p className="text-bone/70">All rights reserved. {year}</p>
        </div>

        <div className="col-span-2 md:col-span-2">
          <Column title="Pages">
            {pages.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className={linkClass}>
                  {p.label}
                </Link>
              </li>
            ))}
          </Column>
        </div>

        <div className="col-span-2 md:col-span-2">
          <Column title="Social media">
            {socialLinks.map((s) => (
              <li key={s.key}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Ikonic on ${s.label}`} className={linkClass}>
                  {socialText[s.key]}
                </a>
              </li>
            ))}
          </Column>
        </div>

        <div className="col-span-2 md:col-span-2">
          <Column title="Services">
            {services.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className={linkClass}>
                  {s.label}
                </Link>
              </li>
            ))}
          </Column>
        </div>

        <div className="col-span-full sm:col-span-2 md:col-span-2 lg:col-span-3">
          <Column title="Contact">
            {contact.map((c) => (
              <li key={c.href}>
                <a href={c.href} className={`${linkClass} break-words`}>
                  {c.label}
                </a>
              </li>
            ))}
          </Column>
        </div>

        <div className="col-span-full flex flex-col items-start gap-s3 border-t border-bone/10 pt-s4 md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label="Ikonic Designs, home" className={linkClass}>
            {FOOTER_LOGO ? (
              <Image src={FOOTER_LOGO.src} alt="Ikonic" width={FOOTER_LOGO.width} height={FOOTER_LOGO.height} unoptimized className="h-s4 w-auto" />
            ) : (
              <span className="font-display-tight text-[1.75rem] leading-none text-bone">
                Ikonic<span className="text-signal">.</span>
              </span>
            )}
          </Link>
          <p className="text-body text-bone/70">Website meticulously crafted by Ikonic Designs</p>
        </div>
      </div>
    </footer>
  );
}
