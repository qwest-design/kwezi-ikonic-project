import { Hero } from "@/components/home/Hero";
import { Manifesto } from "@/components/home/Manifesto";
import { WhatWeDo } from "@/components/home/WhatWeDo";
import { SelectedWork } from "@/components/home/SelectedWork";
import { Proof } from "@/components/home/Proof";
import { Clients } from "@/components/home/Clients";
import { Closing } from "@/components/home/Closing";
import { proof } from "@/content/home";

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <Hero />
      <Manifesto />
      <WhatWeDo />
      <SelectedWork />
      <Proof stats={proof} />
      <Clients />
      <Closing />
    </main>
  );
}
