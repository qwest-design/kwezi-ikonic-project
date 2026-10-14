import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { WorkExplorer } from "@/components/work/WorkExplorer";
import { SEAL_PARKED, SealZone } from "@/components/three/SealZone";
import { workIndex } from "@/content/work";
import { getCaseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected brand, identity, digital and motion work by Ikonic Designs.",
};

export default async function WorkPage() {
  const caseStudies = await getCaseStudies();
  return (
    <main id="main" tabIndex={-1} className="flex flex-col gap-s5 pt-s7 pb-s7 outline-none">
      <SealZone initial pose={{ x: 0.36, y: 0.3, rotY: -0.4, scale: 0.42, mobile: { x: 0.3, y: 0.36, scale: 0.32 } }}>
        <header className="grid-site gap-y-s3 pt-s5">
          <Reveal as="h1" start="top bottom" className="col-span-full font-display-tight text-h1 md:col-span-10">
            {workIndex.title}
          </Reveal>
          <p className="col-span-full max-w-[52ch] text-body text-mist md:col-span-6 md:col-start-7">{workIndex.intro}</p>
        </header>
      </SealZone>
      <SealZone pose={SEAL_PARKED}>
        <WorkExplorer projects={caseStudies} />
      </SealZone>
    </main>
  );
}
