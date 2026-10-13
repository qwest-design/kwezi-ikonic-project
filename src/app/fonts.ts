import { Inter, Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google";

export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  variable: "--font-inter-tight",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
  variable: "--font-instrument-serif",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-inter",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-jetbrains-mono",
});

export const fontVariables = [interTight, instrumentSerif, inter, jetbrainsMono]
  .map((f) => f.variable)
  .join(" ");
