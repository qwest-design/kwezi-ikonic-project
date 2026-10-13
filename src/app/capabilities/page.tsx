import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { SealZone } from "@/components/three/SealZone";
import { FourDs } from "@/components/capabilities/FourDs";
import { capabilitiesPage } from "@/content/pages";

export const metadata: Metadata = {
  title: "Capabilities",
  description: "Strategy, identity, digital and motion from Ikonic Designs, held to one standard.",
};

/** The seal sits top right and turns a quarter for each discipline. */
const pose = (i: number) => ({
  x: 0.36,
  y: 0.28,
  rotY: -0.4 + i * (Math.PI / 2),
  scale: 0.42,
  mobile: { x: 0.32, y: 0.36, scale: 0.28 },
});

export default function CapabilitiesPage() {
  const { title, intro, disciplines, process, cta } = capabilitiesPage;
  return (
    <main id="main" tabIndex={-1} className="pt-s7 outline-none">
      <SealZone initial pose={pose(0)} className="grid-site gap-y-s3 pt-s5 pb-s6">
        <Reveal as="h1" start="top bottom" className="col-span-full font-display-tight text-h1 md:col-span-10">
          {title}
        </Reveal>
        <p className="col-span-full max-w-[52ch] text-body text-mist md:col-span-6 md:col-start-7">{intro}</p>
      </SealZone>

      {disciplines.map((d, i) => (
        <SealZone key={d.title} pose={pose(i)}>
          <section
            id={d.title.toLowerCase()}
            aria-labelledby={`discipline-${d.index}`}
            className="grid-site scroll-mt-s6 gap-y-s4 border-t border-bone/15 py-s7"
          >
            <p className="type-label col-span-full text-mist">
              <span className="text-signal">{d.index}</span> / <span id={`discipline-${d.index}`}>{d.title}</span>
            </p>
            <Reveal as="h2" className="col-span-full font-display-tight text-h1 md:col-span-10">
              {d.headline}
            </Reveal>
            <div className="col-span-full flex flex-col gap-s2 md:col-span-5">
              <h3 className="type-label text-mist">What it’s for</h3>
              <p className="text-body">{d.purpose}</p>
            </div>
            <div className="col-span-full flex flex-col gap-s2 md:col-span-5 md:col-start-8">
              <h3 className="type-label text-mist">Deliverables</h3>
              <ul className="flex flex-col">
                {d.deliverables.map((item, n) => (
                  <li key={item} className="flex gap-s2 border-t border-bone/15 py-s2 text-body">
                    <span className="type-label pt-1 text-mist">{String(n + 1).padStart(2, "0")}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </SealZone>
      ))}

      <div className="border-t border-bone/15">
        <FourDs title={process.title} steps={process.steps} />
      </div>

      <div className="grid-site py-s7">
        <div className="col-span-full">
          <Button href={cta.href}>{cta.label}</Button>
        </div>
      </div>
    </main>
  );
}
