/**
 * Filter chips, in sidebar order.
 *
 * Labels follow the Claude Handoff sidebar (1:443). An earlier extraction from
 * the previous Figma file recorded `Brand Design / Websites / AI Assisted` as
 * the newer set -- the handoff supersedes it. Ids are stable: rename a label
 * freely, never an id, because works.ts tags and the filter tests key off them.
 */
export const FILTERS = [
  { id: "product-design", label: "Product Design", icon: "folder" },
  { id: "shipped", label: "Shipped", icon: "folder" },
  { id: "brand-design", label: "Branding", icon: "folder" },
  { id: "websites", label: "Website", icon: "folder" },
  { id: "motion", label: "Motion", icon: "folder" },
  { id: "growth-automation", label: "Growth & Automation", icon: "folder" },
  { id: "ai-assisted", label: "AI assets", icon: "star" },
] as const;

export type FilterId = (typeof FILTERS)[number]["id"];
export type Filter = (typeof FILTERS)[number];
