import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Parallax } from "@/components/motion/Parallax";
import { SceneLoader } from "@/components/three/SceneLoader";
import { Preloader, introScript } from "@/components/chrome/Preloader";
import { Header } from "@/components/chrome/Header";
import { Menu } from "@/components/chrome/Menu";
import { Cursor } from "@/components/chrome/Cursor";
import { Magnetic } from "@/components/chrome/Magnetic";
import { PageTransition } from "@/components/chrome/PageTransition";
import { SiteContent } from "@/components/chrome/SiteContent";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ikonicdesigns.co.za"),
  title: {
    default: "Ikonic Designs | Brand and digital studio",
    template: "%s | Ikonic Designs",
  },
  description:
    "Ikonic Designs is a South African brand and digital studio: strategy, identity, digital and motion.",
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-ZA" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: skips the preloader on repeat visits in this tab. */}
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript>
          <style>{`.preloader{display:none}`}</style>
        </noscript>
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SceneLoader />
        <Header />
        <SmoothScroll>
          <SiteContent>
            {children}
            <SiteFooter />
          </SiteContent>
        </SmoothScroll>
        <Menu />
        <PageTransition />
        <Cursor />
        <Magnetic />
        <Parallax />
        <Preloader />
      </body>
    </html>
  );
}
