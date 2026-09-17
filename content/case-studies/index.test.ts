import { describe, expect, it } from "vitest";
import { WORKS } from "@/content/works";
import { CASE_STUDIES, headingsOf, nextStudy, studyBySlug } from "./index";

describe("case study content", () => {
  it("every study belongs to a work on the shelf", () => {
    const slugs = new Set(WORKS.map((w) => w.slug));
    for (const s of CASE_STUDIES) expect(slugs).toContain(s.slug);
  });

  it("registers each slug once", () => {
    const slugs = CASE_STUDIES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  /**
   * The invariant this whole round exists to protect. A popover pill either
   * reaches a study that is built, or leaves the site -- never a local route
   * with nothing behind it. Both directions matter:
   *   - a work WITHOUT a study and WITHOUT an href renders a link to a 404;
   *   - a work WITH a study but also an href silently buries the study.
   */
  it("every linking work resolves somewhere real", () => {
    for (const work of WORKS) {
      if (work.cta === "coming-soon") continue;
      const study = studyBySlug(work.slug);
      if (work.href) {
        expect(study, `${work.slug} links off-site but also has a study`).toBeUndefined();
        expect(work.href).toMatch(/^https:\/\//);
      } else {
        expect(study, `${work.slug} links to /work/${work.slug} with no study`).toBeDefined();
      }
    }
  });

  it("only offers moreHref where a more pill is drawn", () => {
    for (const work of WORKS) {
      if (work.moreHref) expect(work.cta).toBe("more-view");
    }
  });

  it("gives every study the fields a page cannot render without", () => {
    for (const s of CASE_STUDIES) {
      for (const field of ["client", "sector", "chipLabel", "title"] as const) {
        expect(s[field], `${s.slug}.${field}`).toBeTruthy();
      }
      expect(s.cover.width).toBeGreaterThan(0);
      expect(s.cover.height).toBeGreaterThan(0);
    }
  });

  /**
   * Placeholder text must never reach a visitor.
   *
   * The optional fields exist precisely so an unfinished study omits them
   * rather than filling them with a marker. A truthiness check passed "TODO"
   * happily, and it rendered as "TODO · TODO" in the next-study footer.
   */
  it("never renders placeholder text", () => {
    const strings = (v: unknown): string[] =>
      typeof v === "string" ? [v]
      : Array.isArray(v) ? v.flatMap(strings)
      : v && typeof v === "object" ? Object.values(v).flatMap(strings)
      : [];

    for (const s of CASE_STUDIES) {
      for (const text of strings(s)) {
        expect(text, `${s.slug} carries placeholder copy`).not.toMatch(/\bTODO\b/i);
        expect(text.trim(), `${s.slug} has an empty string field`).not.toBe("");
      }
    }
  });

  /**
   * House style: no em dashes in body copy.
   *
   * `hook` is exempt because it is a verbatim quote transcribed from the source
   * -- the dash there is the speaker attribution, and rewriting someone's
   * quoted words to satisfy a style rule is worse than the dash.
   */
  it("keeps em dashes out of the copy", () => {
    for (const study of CASE_STUDIES) {
      for (const b of study.blocks) {
        const text = [
          "text" in b ? b.text : "",
          b.type === "quote" ? (b.attribution ?? "") : "",
          b.type === "list" ? b.items.join(" ") : "",
          b.type === "metrics" ? b.items.map((i) => `${i.value} ${i.label}`).join(" ") : "",
        ].join(" ");
        expect(text, `${study.slug}: em dash in body copy`).not.toMatch(/[—–]/);
      }
      for (const field of ["title", "role", "scope", "timeline", "client"] as const) {
        expect(study[field] ?? "", `${study.slug}.${field}`).not.toMatch(/[—–]/);
      }
    }
  });

  it("keeps optional fields optional rather than blank", () => {
    // Absent is fine; present-but-empty is a bug, because the masthead decides
    // whether to draw a cell by truthiness.
    for (const s of CASE_STUDIES) {
      for (const field of ["hook", "role", "scope", "timeline"] as const) {
        if (field in s) expect(s[field], `${s.slug}.${field}`).toBeTruthy();
      }
    }
  });

  it("keeps subheadings out of the rail", () => {
    // 112u of margin holds five section labels, not twenty. Subheadings help
    // someone skim inside a section; the rail describes the article's shape.
    for (const s of CASE_STUDIES) {
      const subs = s.blocks.filter((b) => b.type === "subheading").length;
      const railed = headingsOf(s).length;
      const sections = s.blocks.filter((b) => b.type === "heading").length;
      expect(railed, `${s.slug}: rail should list ${sections} sections`).toBe(sections);
      if (subs) expect(railed).toBeLessThan(subs + sections);
    }
  });

  it("keeps heading ids unique inside a study, so the rail can anchor to them", () => {
    for (const s of CASE_STUDIES) {
      const ids = headingsOf(s).map((h) => h.id);
      expect(new Set(ids).size, `${s.slug} has duplicate heading ids`).toBe(ids.length);
    }
  });

  it("gives every image and video intrinsic dimensions", () => {
    for (const s of CASE_STUDIES) {
      for (const b of s.blocks) {
        if (b.type === "image") expect(b.media.width * b.media.height).toBeGreaterThan(0);
        if (b.type === "gallery") for (const m of b.items) expect(m.width * m.height).toBeGreaterThan(0);
        if (b.type === "loop") expect(b.media.width * b.media.height).toBeGreaterThan(0);
        if (b.type === "vimeo") expect(b.width * b.height).toBeGreaterThan(0);
        if (b.type === "drive") expect(b.width * b.height).toBeGreaterThan(0);
      }
    }
  });

  it("cycles the next-study footer rather than dead-ending", () => {
    const last = CASE_STUDIES[CASE_STUDIES.length - 1];
    expect(nextStudy(last.slug)).toBe(CASE_STUDIES[0]);
    expect(nextStudy("not-a-work")).toBeUndefined();
  });
});
