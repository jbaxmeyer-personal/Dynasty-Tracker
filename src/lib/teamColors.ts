import { findSchool } from "../data/schools";

/** Team-colored gradient background for hero cards. Falls back to the app's default accent for schools without mapped brand colors. */
export function teamGradient(school: string): string {
  const s = findSchool(school);
  const primary = s?.primaryColor ?? "#4f8cff";
  const secondary = s?.secondaryColor ?? "#2a2e38";
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 140%)`;
}
