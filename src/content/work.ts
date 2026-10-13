import { selectedWork } from "./home";

export type Project = {
  slug: string;
  title: string;
};

// Every project linked from the site needs a page. Until case studies have their
// own content file, the Home page's selected work is the source.
export const projects: Project[] = selectedWork.projects.map((p) => ({ slug: p.slug, title: p.name }));

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
