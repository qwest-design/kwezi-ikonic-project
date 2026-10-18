import type { Metadata } from "next";
import Link from "next/link";
import { Button, type ButtonPreviewState, type ButtonVariant } from "@/components/ui/Button";
import { MotionDemo } from "./MotionDemo";
import { SealDemo } from "./SealDemo";
import { Proof } from "@/components/home/Proof";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const colours = [
  { name: "ink", hex: "#0B0B0C", swatch: "bg-ink border border-graphite", note: "Main background" },
  { name: "bone", hex: "#F2EFE9", swatch: "bg-bone", note: "Text · 17.1:1 on ink" },
  { name: "graphite", hex: "#1A1A1D", swatch: "bg-graphite", note: "Surfaces" },
  { name: "mist", hex: "#8A8A8F", swatch: "bg-mist", note: "Secondary text · 5.7:1 on ink" },
  { name: "signal", hex: "#003CE5", swatch: "bg-signal", note: "Fills only · bone on it 6.6:1" },
  { name: "signal-bright", hex: "#5980EE", swatch: "bg-signal-bright", note: "Text and lines on dark · 5.4:1 on ink" },
] as const;

const typeScale = [
  { name: "hero", className: "font-display-tight text-hero", range: "72 → 240px", sample: "Earn it" },
  { name: "h1", className: "font-display-tight text-h1", range: "56 → 160px", sample: "Studio" },
  { name: "h2", className: "font-display-tight text-h2", range: "40 → 120px", sample: "Selected work" },
  { name: "h3", className: "font-display-tight text-h3", range: "28 → 48px", sample: "Brand identity" },
  {
    name: "body",
    className: "text-body max-w-[60ch]",
    range: "17 → 19px",
    sample:
      "Ikonic Designs is a South African brand and digital studio. We build identities, websites and motion that earn their place.",
  },
  { name: "label", className: "type-label", range: "13px · uppercase · +0.08em", sample: "Strategy · Identity · Digital" },
] as const;

const families = [
  { name: "Display", spec: "Inter Tight 600 · -0.04em", className: "font-display-tight text-h3" },
  { name: "Accent", spec: "Instrument Serif italic", className: "font-accent-italic text-h3" },
  { name: "Body", spec: "Inter 400", className: "font-sans text-h3" },
  { name: "Mono", spec: "JetBrains Mono 400", className: "font-mono text-h3" },
] as const;

const spacing = [
  { token: "s1", px: 8 },
  { token: "s2", px: 16 },
  { token: "s3", px: 24 },
  { token: "s4", px: 40 },
  { token: "s5", px: 64 },
  { token: "s6", px: 104 },
  { token: "s7", px: 168 },
] as const;

const buttonVariants: ButtonVariant[] = ["primary", "secondary", "ghost"];
const buttonStates: { label: string; preview?: ButtonPreviewState; disabled?: boolean }[] = [
  { label: "Default" },
  { label: "Hover", preview: "hover" },
  { label: "Focus", preview: "focus" },
  { label: "Active", preview: "active" },
  { label: "Disabled", disabled: true },
];

const parallaxSamples = [
  { speed: "0.7", label: "0.7" },
  { speed: "0.85", label: "0.85" },
  { speed: "1", label: "1 (static)" },
  { speed: "1.15", label: "1.15" },
] as const;

const routes = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/work/the-gardens", label: "Work / The Gardens" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid-site gap-y-s4 border-t border-graphite py-s5">
      <h2 id={id} className="col-span-full type-label text-mist">
        {title}
      </h2>
      <div className="col-span-full">{children}</div>
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main id="main" tabIndex={-1} className="pb-s6 outline-none">
      <header className="grid-site gap-y-s3 py-s6">
        <p className="col-span-full type-label text-mist">Internal · not indexed</p>
        <h1 className="col-span-full font-display-tight text-h1">
          Style<span className="font-accent-italic">guide</span>
        </h1>
      </header>

      <Section id="sg-colour" title="Colour">
        <ul className="grid grid-cols-2 gap-gutter md:grid-cols-5">
          {colours.map((c) => (
            <li key={c.name} className="flex flex-col gap-s1">
              <span className={`block aspect-square rounded-sm ${c.swatch}`} aria-hidden="true" />
              <span className="font-mono text-sm">--{c.name}</span>
              <span className="font-mono text-sm text-mist">{c.hex}</span>
              <span className="text-sm text-mist">{c.note}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sg-type" title="Type scale">
        <ul className="flex flex-col gap-s5">
          {typeScale.map((t) => (
            <li key={t.name} className="flex flex-col gap-s2">
              <span className="type-label text-mist">
                {t.name} · {t.range}
              </span>
              <p className={t.className}>{t.sample}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sg-fonts" title="Families">
        <ul className="grid gap-s4 md:grid-cols-2">
          {families.map((f) => (
            <li key={f.name} className="flex flex-col gap-s1">
              <span className="type-label text-mist">
                {f.name} · {f.spec}
              </span>
              <p className={f.className}>Ikonic 0123</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sg-spacing" title="Spacing">
        <ul className="flex flex-col gap-s2">
          {spacing.map((s) => (
            <li key={s.token} className="flex items-center gap-s3">
              <span className="w-24 shrink-0 font-mono text-sm text-mist">
                {s.token} · {s.px}
              </span>
              <span className="block h-s2 bg-signal" style={{ width: s.px }} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sg-grid" title="Grid · 12 columns, 24px gutters, 48px margins (4 columns, 16px on mobile)">
        <div aria-hidden="true" className="grid grid-cols-[repeat(var(--grid-columns),minmax(0,1fr))] gap-gutter">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="flex h-s6 items-end justify-center bg-graphite pb-s1 font-mono text-xs text-mist max-md:[&:nth-child(n+5)]:hidden"
            >
              {i + 1}
            </span>
          ))}
        </div>
      </Section>

      <Section id="sg-buttons" title="Buttons">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-separate border-spacing-y-s3 text-left">
            <thead>
              <tr>
                <th scope="col" className="type-label font-normal text-mist">
                  Variant
                </th>
                {buttonStates.map((s) => (
                  <th key={s.label} scope="col" className="type-label font-normal text-mist">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buttonVariants.map((v) => (
                <tr key={v}>
                  <th scope="row" className="font-mono text-sm font-normal capitalize">
                    {v}
                  </th>
                  {buttonStates.map((s) => (
                    <td key={s.label}>
                      <Button variant={v} preview={s.preview} disabled={s.disabled} tabIndex={s.preview ? -1 : undefined}>
                        Start a project
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-s3 text-sm text-mist">
          Forced states are previews and skip the tab order. The Default column is live: hover, tab to and press it.
        </p>
      </Section>

      <Section id="sg-motion" title="Motion · transform and opacity only">
        <MotionDemo />
      </Section>

      <Section id="sg-reveal" title="Reveal · masked lines, expo.out 0.9s, stagger 0.08s, at 80% viewport">
        <div className="flex flex-col gap-s6">
          <Reveal as="h3" className="font-display-tight text-h2">
            We make brands that <span className="font-accent-italic">earn</span> their place.
          </Reveal>
          <Reveal as="p" className="max-w-[48ch] text-h3 font-display-tight">
            Strategy, identity, digital and motion, built in South Africa for clients who want to be remembered.
          </Reveal>
          <Reveal as="p" className="max-w-[60ch] text-body text-mist">
            Body copy reveals line by line too. Resize the window after this has played: the text re-splits to the new
            line breaks and stays put instead of replaying. With reduced motion on, each block simply fades in over 0.3s.
          </Reveal>
        </div>
      </Section>

      <Section id="sg-parallax" title="Parallax · data-speed (off under 768px and with reduced motion)">
        <ul className="grid grid-cols-2 gap-gutter py-s6 md:grid-cols-4">
          {parallaxSamples.map((p) => (
            <li key={p.speed} data-speed={p.speed} className="flex aspect-[3/4] items-end bg-graphite p-s2">
              <span className="font-mono text-sm text-mist">data-speed=&quot;{p.label}&quot;</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sg-seal" title="Seal · idle, travel, stamp">
        <SealDemo />
      </Section>

      <Section id="sg-cursor" title="Cursor and magnetic buttons (mouse or trackpad)">
        <div className="flex flex-col gap-s4">
          <ul className="grid gap-gutter md:grid-cols-3">
            {(["view", "drag", "play"] as const).map((c) => (
              <li
                key={c}
                data-cursor={c}
                className="flex aspect-[4/3] items-end bg-graphite p-s2 font-mono text-sm text-mist"
              >
                data-cursor=&quot;{c}&quot;
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-s3">
            <Button>Magnetic primary</Button>
            <Button variant="secondary">Magnetic secondary</Button>
            <Button variant="ghost">Ghost (not magnetic)</Button>
          </div>
        </div>
      </Section>

      <Section id="sg-proof" title="Proof counters · sample numbers, not real data">
        <Proof
          stats={[
            { value: 120, suffix: "+", label: "Sample: brands launched" },
            { value: 14, label: "Sample: years" },
            { value: 3200, prefix: "R", suffix: "m", label: "Sample: revenue influenced" },
            { value: 98, suffix: "%", label: "Sample: retention" },
          ]}
        />
      </Section>

      <Section id="sg-routes" title="Routes">
        <ul className="flex flex-wrap gap-s3">
          {routes.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="font-mono text-sm underline decoration-bone/30 underline-offset-4 hover:decoration-signal-bright">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
