export type NavItem = { href: string; label: string; preview: string };

/** Main navigation, in menu order. Preview images are placeholders until real imagery lands. */
export const nav: NavItem[] = [
  { href: "/", label: "Home", preview: "/menu/home.svg" },
  { href: "/work", label: "Work", preview: "/menu/work.svg" },
  { href: "/capabilities", label: "Capabilities", preview: "/menu/capabilities.svg" },
  { href: "/studio", label: "Studio", preview: "/menu/studio.svg" },
  { href: "/contact", label: "Contact", preview: "/menu/contact.svg" },
];
