"use client";

import Image from "next/image";
import { SmilePlus } from "lucide-react";
import { COMMENTS, type Comment, type Reaction } from "@/content/comments";

/**
 * The Comments panel, built as a chat thread.
 *
 * No Figma design exists for this one; the anatomy follows the comment-thread
 * reference Praise supplied -- avatar, name, presence dot, body, then an action
 * row of reactions + Reply + timestamp, with his answer indented beneath. The
 * reference is a neutral light UI, so it supplies the pattern only: the skin
 * here is the kitchen's own palette and dashed-box language.
 *
 * The testimonials are real people's words and are rendered in full. Nothing
 * here truncates them -- the panel scrolls instead.
 */

function ReactionPills({ reactions }: { reactions: Reaction[] }) {
  return (
    <>
      {reactions.map((r) => (
        <span
          key={r.emoji}
          className="chip [--chip-h:16px] gap-0.5 border-kitchen-purple/40 px-1 text-[10px]"
        >
          <span aria-hidden>{r.emoji}</span>
          <span className="tabular">{r.count}</span>
        </span>
      ))}
    </>
  );
}

/** Reply and the reaction affordance are decorative until comments are real. */
function ActionRow({
  reactions,
  postedAt,
}: {
  reactions: Reaction[];
  postedAt: string;
}) {
  return (
    <div className="mt-1.5 flex items-center gap-1.5 text-fine">
      <SmilePlus aria-hidden className="size-3.5 shrink-0" />
      <ReactionPills reactions={reactions} />
      <span aria-hidden className="h-3 w-px bg-kitchen-purple/25" />
      <span>{postedAt}</span>
    </div>
  );
}

function Author({
  name,
  avatar,
  role,
  size = 20,
}: {
  name: string;
  avatar: string;
  role?: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="relative block shrink-0 overflow-clip rounded-full border border-kitchen-purple/50"
        style={{ width: size, height: size }}
      >
        <Image src={avatar} alt="" aria-hidden fill sizes="32px" className="object-cover" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-fine font-bold">{name}</span>
        {role && <span className="block truncate text-[10px]">{role}</span>}
      </span>
    </div>
  );
}

function Thread({ comment }: { comment: Comment }) {
  return (
    <li className="flex flex-col gap-2 border-b border-dashed border-kitchen-purple/25 pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <Author {...comment.author} />
        {comment.body.split("\n\n").map((para, i) => (
          <p key={i} className="text-fine text-pretty">
            {para}
          </p>
        ))}
        <ActionRow reactions={comment.reactions} postedAt={comment.postedAt} />
      </div>

      {/* Praise's answer, indented under the comment it belongs to. */}
      <div className="ml-3 flex flex-col gap-1 border-l border-dashed border-kitchen-purple/25 pl-2">
        <Author
          name="Praise Fabilola"
          avatar="/assets/brand/praise-avatar.webp"
          size={18}
        />
        <p className="text-fine text-pretty">
          <span className="rounded-(--radius-chip) bg-kitchen-purple px-1 py-px text-kitchen-ink">
            @{comment.author.name}
          </span>{" "}
          {comment.reply.body}
        </p>
        <ActionRow reactions={[]} postedAt={comment.reply.postedAt} />
      </div>
    </li>
  );
}

export function CommentsThread() {
  return (
    // tabIndex makes the scroll container reachable, so the thread can be
    // read with the keyboard alone -- a scrollable region that only a mouse
    // wheel can move is unusable without one.
    <ul
      tabIndex={0}
      aria-label="Comments"
      className="flex max-h-[46vh] flex-col gap-3 overflow-y-auto pr-1 text-kitchen-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-purple"
    >
      {COMMENTS.map((c) => (
        <Thread key={c.id} comment={c} />
      ))}
    </ul>
  );
}
