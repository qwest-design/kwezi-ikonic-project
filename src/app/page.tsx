import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { SelectedWork } from "@/components/home/SelectedWork";
import { Proof } from "@/components/home/Proof";
import { Clients } from "@/components/home/Clients";
import { Closing } from "@/components/home/Closing";
import { toHomeProject } from "@/content/home";
import { getCaseStudies, getClients, getProof } from "@/lib/content";

export default async function Home() {
  const [projects, clients, proof] = await Promise.all([getCaseStudies(), getClients(), getProof()]);
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero />
      <Manifesto />
      <WhatWeDo />
      <SelectedWork projects={projects.map(toHomeProject)} />
      <Proof stats={proof} />
      <Clients logos={clients} />
      <Closing />
    </main>
  );
}
