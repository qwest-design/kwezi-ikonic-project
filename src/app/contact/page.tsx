import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { SEAL_PARKED, SealZone } from "@/components/three/SealZone";
import { BriefForm } from "@/components/contact/BriefForm";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { contactPage } from "@/content/pages";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a project with Ikonic Designs. Tell us what you need in four short steps.",
};

export default function ContactPage() {
  return (
    <main id="main" tabIndex={-1} className="pt-s7 pb-s7 outline-none">
      <SealZone initial pose={{ x: 0.38, y: 0.32, rotY: -0.4, scale: 0.36, mobile: { x: 0.32, y: 0.38, scale: 0.28 } }} className="grid-site pt-s5 pb-s6">
        <Reveal as="h1" start="top bottom" className="col-span-full font-display-tight text-h1 md:col-span-10">
          {contactPage.title}
        </Reveal>
      </SealZone>
      {/* Out of the way while filling in the brief; it comes back to stamp on success. */}
      <SealZone pose={SEAL_PARKED} className="grid-site gap-y-s6">
        <div className="relative col-span-full md:col-span-7">
          <BriefForm />
        </div>
        <aside aria-label="Contact details" className="col-span-full md:col-span-4 md:col-start-9">
          <ContactDetails />
        </aside>
      </SealZone>
    </main>
  );
}
