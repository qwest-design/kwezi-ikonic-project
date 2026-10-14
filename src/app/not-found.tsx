import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="grid-site min-h-svh content-center gap-y-s4 py-s7 outline-none">
      <p className="type-label col-span-full text-signal">404</p>
      <Reveal as="h1" start="top bottom" className="col-span-full font-display-tight text-h1 md:col-span-10">
        This page isn’t <span className="font-accent-italic">iconic</span> yet.
      </Reveal>
      <div className="col-span-full">
        <Button href="/">Back to home</Button>
      </div>
    </main>
  );
}
