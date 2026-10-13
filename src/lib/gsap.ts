"use client";

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Register once, client side only. Import gsap from here, not from "gsap".
if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip, ScrollTrigger, SplitText);
}

export { gsap, Flip, ScrollTrigger, SplitText };
