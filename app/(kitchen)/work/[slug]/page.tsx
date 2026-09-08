import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FILTERS } from "@/content/filters";
import { WORKS } from "@/content/works";
import { CASE_STUDIES, headingsOf, nextStudy, studyBySlug } from "@/content/case-studies";
import { StudyWindow } from "@/components/casestudy/StudyWindow";
import { StudyHeader } from "@/components/casestudy/StudyHeader";
import { StudyMasthead } from "@/components/casestudy/StudyMasthead";
import { StudyBody } from "@/components/casestudy/StudyBody";
import { ProgressRail } from "@/components/casestudy/ProgressRail";
import { NextStudy } from "@/components/casestudy/NextStudy";
import { Reveal } from "@/components/motion/Reveal";

type Params = { params: Promise<{ slug: string }> };

/** Only the works that actually have a study. The other four link off-site from
 *  the popover and never reach this route; anything else is a genuine 404. */
export function generateStaticParams() {
  return CASE_STUDIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const study = studyBySlug((await params).slug);
  if (!study) return {};
  return {
    title: `${study.client} — ${study.title}`,
    description: study.hook,
    openGraph: { title: study.title, description: study.hook, images: [study.cover.src] },
  };
}

export default async function StudyPage({ params }: Params) {
  const { slug } = await params;
  const study = studyBySlug(slug);
  const work = WORKS.find((w) => w.slug === slug);
  if (!study || !work) notFound();

  const filter = FILTERS.find((f) => f.id === work.tags[0]);
  const headings = headingsOf(study).map(({ id, label }) => ({ id, label }));
  const next = nextStudy(slug);

  return (
    <StudyWindow>
      <StudyHeader
        filterId={filter?.id}
        filterLabel={filter?.label ?? "Work"}
        chipLabel={study.chipLabel}
      />

      {/* The Window is the scroll container, as it is in the kitchen. */}
      <div data-study-scroll className="min-h-0 flex-1 overflow-y-auto">
        {/*
          Padding on the wrapper, measure on the article: 519 centred in 1077 is
          what the design draws, and max-w holds it exactly at every desktop
          width. Below it the column simply narrows -- this page reflows where
          the kitchen pans, because a document that scrolls sideways on a phone
          is not a document.
        */}
        <div className="px-4 pt-16 pb-24">
          <article className="mx-auto w-full max-w-[519px]">
            <StudyMasthead study={study} />
            <div className="pt-[30px]">
              <StudyBody blocks={study.blocks} />
            </div>
            {next && (
              // The last thing in the article arrives like everything above it.
              <Reveal on="view" kind="arrive">
                <NextStudy study={next} />
              </Reveal>
            )}
          </article>
        </div>
      </div>

      {/* Outside the scroller: the rail describes the article rather than
          travelling with it, so it stays put while the page moves under it. */}
      <ProgressRail headings={headings} />
    </StudyWindow>
  );
}
