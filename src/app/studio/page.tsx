import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { SEAL_PARKED, SealZone } from "@/components/three/SealZone";
import { Beliefs } from "@/components/studio/Beliefs";
import { studioPage } from "@/content/pages";
import Link from "next/link";
import { clientHref, clients } from "@/content/home";

export const metadata: Metadata = {
  title: "Studio",
  description: "Ikonic Designs is a South African brand and digital studio: normal people with unreasonable standards.",
};

export default function StudioPage() {
  const { title, intro, beliefsTitle, beliefs, teamTitle, team, clientsTitle } = studioPage;
  return (
    <main id="main" tabIndex={-1} className="pt-s7 outline-none">
      <SealZone initial pose={{ x: 0.36, y: 0.28, rotY: -0.4, scale: 0.42, mobile: { x: 0.32, y: 0.36, scale: 0.28 } }} className="grid-site gap-y-s3 pt-s5 pb-s7">
        <Reveal as="h1" start="top bottom" className="col-span-full font-display-tight text-h1 md:col-span-10">
          {title}
        </Reveal>
        <p className="col-span-full max-w-[52ch] text-body text-mist md:col-span-6 md:col-start-7">{intro}</p>
      </SealZone>

      <SealZone pose={{ x: 0.38, y: -0.3, rotY: 1.45, scale: 0.4, mobile: { x: 0.36, y: -0.36, scale: 0.28 } }}>
        <Beliefs title={beliefsTitle} beliefs={beliefs} />
      </SealZone>

      <SealZone pose={SEAL_PARKED}>
        <section aria-labelledby="team-title" className="grid-site gap-y-s5 border-t border-bone/15 py-s7">
          <Reveal as="h2" id="team-title" className="col-span-full font-display-tight text-h2">
            {teamTitle}
          </Reveal>
          <ul className="col-span-full grid grid-cols-2 gap-x-gutter gap-y-s5 md:grid-cols-3">
            {team.map((m) => (
              // Colour on hover or keyboard focus: the grey copy on top fades out (opacity only).
              <li key={m.portrait} tabIndex={0} className="group flex flex-col gap-s2 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-graphite">
                  <Image src={m.portrait} alt={`Portrait of ${m.name}`} fill unoptimized sizes="(min-width: 768px) 30vw, 45vw" className="object-cover" />
                  <Image
                    src={m.portrait}
                    alt=""
                    aria-hidden="true"
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 30vw, 45vw"
                    className="object-cover grayscale transition-opacity duration-(--duration-ui) group-hover:opacity-0 group-focus-visible:opacity-0"
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-body">{m.name}</h3>
                  <p className="type-label text-mist">{m.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="clients-title" className="grid-site gap-y-s5 border-t border-bone/15 py-s7">
          <Reveal as="h2" id="clients-title" className="col-span-full font-display-tight text-h2">
            {clientsTitle}
          </Reveal>
          <ul className="col-span-full grid grid-cols-2 border-t border-l border-bone/15 sm:grid-cols-3 lg:grid-cols-5">
            {clients.logos.map((c) => {
              const href = clientHref(c);
              const art = (
                <div className="absolute inset-[22%]">
                  <Image src={c.logo} alt={c.name} fill unoptimized className="object-contain opacity-70 grayscale" />
                  <Image
                    src={c.logo}
                    alt=""
                    aria-hidden="true"
                    fill
                    unoptimized
                    className="object-contain opacity-0 transition-opacity duration-(--duration-ui) group-hover:opacity-100"
                  />
                </div>
              );
              return (
                <li key={c.name} className="group relative aspect-[3/2] border-r border-b border-bone/15">
                  {href ? (
                    <Link href={href} data-cursor="view" className="absolute inset-0">
                      {art}
                    </Link>
                  ) : (
                    art
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </SealZone>
    </main>
  );
}
