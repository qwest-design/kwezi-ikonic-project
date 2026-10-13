/**
 * Social profile URLs: the one place to set them. An empty string hides that network
 * everywhere (footer and contact page) rather than rendering a dead link.
 * [TO SUPPLY]: the live site lists these networks without URLs.
 */
export const social = {
  facebook: "",
  instagram: "",
  twitter: "",
  linkedin: "",
  tiktok: "",
};

export const socialLabels: Record<keyof typeof social, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

/** Networks that have a URL, in display order. */
export const socialLinks = (Object.keys(social) as (keyof typeof social)[])
  .filter((k) => social[k])
  .map((k) => ({ key: k, label: socialLabels[k], href: social[k] }));
