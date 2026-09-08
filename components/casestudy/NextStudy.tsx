import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/content/case-studies";

/**
 * The footer that hands the reader the next study.
 *
 * The whole card is one link rather than a titled block with a separate "read
 * more" -- at the end of a long article the reader is deciding whether to
 * continue, and the decision should not require aiming at a small target.
 */
export function NextStudy({ study }: { study: CaseStudy }) {
  return (
    <Link
      href={`/work/${study.slug}`}
      className="group mt-28 block border-t border-kitchen-brown/20 pt-16 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kitchen-ink"
    >
      <p className="font-doto text-fine tracking-[-0.04em] text-kitchen-brown-deep uppercase">
        Next case study
      </p>

      <p className="mt-4 text-lead font-medium text-balance text-kitchen-ink group-hover:underline group-hover:underline-offset-4">
        {study.title}
      </p>

      {[study.scope, study.timeline].some(Boolean) && (
        <p className="mt-2 text-body leading-prose text-kitchen-brown-deep">
          {[study.scope, study.timeline].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-[2px] border border-b-2 border-kitchen-brown">
        <Image
          src={study.cover.src}
          alt=""
          aria-hidden
          width={study.cover.width}
          height={study.cover.height}
          sizes="(max-width: 640px) 100vw, 519px"
          className="h-auto w-full transition-transform duration-(--duration-state) ease-(--ease-smooth) group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
        />
      </div>
    </Link>
  );
}
