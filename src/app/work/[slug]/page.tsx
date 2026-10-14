import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Challenge, Craft, Idea } from "@/components/case-study/CaseStudySections";
import { Impact, NextProject, Opener } from "@/components/case-study/CaseStudyClient";
import { SEAL_PARKED, SealZone } from "@/components/three/SealZone";
import { getCaseStudies, getCaseStudy, getNextCaseStudy } from "@/lib/content";

export async function generateStaticParams() {
  return (await getCaseStudies()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const project = await getCaseStudy((await params).slug);
  if (!project) return { title: "Work" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: { images: [{ url: project.hero.src, width: project.hero.width, height: project.hero.height, alt: project.hero.alt }] },
  };
}

/** Case study template: opener, challenge, idea, craft, impact with the stamp, next project. */
export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const [project, next, all] = await Promise.all([getCaseStudy(slug), getNextCaseStudy(slug), getCaseStudies()]);
  if (!project) notFound();
  const index = all.findIndex((p) => p.slug === next.slug);

  return (
    <main key={slug} id="main" tabIndex={-1} className="outline-none">
      <Opener project={project} />
      {/* The seal turns edge-on at the left through the story, then parks while the images run. */}
      <SealZone pose={{ x: -0.4, y: 0.05, rotY: 1.45, scale: 0.55, mobile: { x: -0.42, y: 0.3, scale: 0.4 } }}>
        <Challenge project={project} />
        <Idea project={project} />
      </SealZone>
      <SealZone pose={SEAL_PARKED}>
        <Craft project={project} />
      </SealZone>
      <Impact project={project} />
      <NextProject key={next.slug} next={next} index={index} total={all.length} />
    </main>
  );
}
