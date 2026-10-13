import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
/** Forces a visual state. Only for the styleguide; real buttons get states from the browser. */
export type ButtonPreviewState = "hover" | "focus" | "active";

const base =
  "group/btn relative inline-flex items-center justify-center gap-s1 rounded-full px-s3 min-h-12 " +
  "type-label whitespace-nowrap select-none " +
  "transition-[scale,opacity,background-color,color,border-color] duration-(--duration-ui) ease-expo-out " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal " +
  "active:scale-[0.97] data-[preview=active]:scale-[0.97] " +
  "data-[preview=focus]:outline-2 data-[preview=focus]:outline-offset-4 data-[preview=focus]:outline-signal " +
  "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  // Ink on signal: ~5.9:1. Bone on signal fails AA, so never use it here.
  primary:
    "bg-signal text-ink hover:bg-bone data-[preview=hover]:bg-bone data-[preview=active]:bg-bone",
  secondary:
    "border border-bone/40 text-bone hover:border-bone hover:bg-bone hover:text-ink " +
    "data-[preview=hover]:border-bone data-[preview=hover]:bg-bone data-[preview=hover]:text-ink " +
    "data-[preview=active]:border-bone data-[preview=active]:bg-bone data-[preview=active]:text-ink",
  ghost:
    "px-0 text-bone underline decoration-bone/30 underline-offset-[6px] hover:decoration-signal " +
    "data-[preview=hover]:decoration-signal data-[preview=active]:decoration-signal",
};

type Common = {
  variant?: ButtonVariant;
  /** Pulls towards the pointer (see Magnetic). On by default except for ghost buttons and previews. */
  magnetic?: boolean;
  preview?: ButtonPreviewState;
  className?: string;
};

type AsButton = Common & ComponentPropsWithoutRef<"button"> & { href?: undefined };
type AsLink = Common & Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

export function buttonClasses(variant: ButtonVariant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`;
}

/** Renders a Next Link when given href, otherwise a <button>. Never pass href="#". */
export function Button(props: AsButton | AsLink) {
  const { variant = "primary", preview, magnetic = variant !== "ghost" && !preview, className, ...rest } = props;
  const classes = buttonClasses(variant, className);
  const magneticAttr = magnetic ? "" : undefined;

  if (rest.href !== undefined) {
    const { href, ...linkRest } = rest as AsLink;
    return <Link href={href} data-preview={preview} data-magnetic={magneticAttr} className={classes} {...linkRest} />;
  }

  const { type = "button", ...buttonRest } = rest as AsButton;
  return <button type={type} data-preview={preview} data-magnetic={magneticAttr} className={classes} {...buttonRest} />;
}
