import { Reveal } from "@/components/motion/Reveal";

/** Empty page shell: one heading so each route is valid, landmarked and titled. Content comes later. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <main id="main" tabIndex={-1} className="grid-site min-h-svh content-center py-s6 outline-none">
      <Reveal as="h1" start="top bottom" className="col-span-full font-display-tight text-h1">
        {title}
      </Reveal>
    </main>
  );
}
