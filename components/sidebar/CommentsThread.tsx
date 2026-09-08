"use client";

import Image from "next/image";
import { COMMENTS, type Comment } from "@/content/comments";
import { useGuestbook, removeReply } from "@/lib/guestbook";
import { CommentActions } from "./CommentActions";
import { CommentBody } from "./CommentBody";

/**
 * The Comments panel, built as a chat thread.
 *
 * No Figma design exists for this one; the anatomy follows the comment-thread
 * reference Praise supplied -- avatar, name, presence dot, body, then an action
 * row of reactions + Reply + timestamp, with his answer indented beneath. The
 * reference is a neutral light UI, so it supplies the pattern only: the skin
 * here is the kitchen's own palette and dashed-box language.
 *
 * The testimonials are real people's words and every one of them is rendered in
 * full. Long ones are CLAMPED behind a "Read more" -- painted short, never
 * shortened; see CommentBody for why that distinction is enforced rather than
 * assumed.
 *
 * A visitor can react and reply. Both are stored in their own browser and go
 * nowhere else (lib/guestbook), and both are drawn so they cannot be mistaken
 * for the real thread: replies are labelled "You" and carry a local badge.
 */

function Author({
  name,
  avatar,
  role,
  linkedin,
  size = 20,
}: {
  name: string;
  avatar: string;
  role?: string;
  linkedin?: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="relative block shrink-0 overflow-clip rounded-full border border-kitchen-surface/50"
        style={{ width: size, height: size }}
      >
        <Image src={avatar} alt="" aria-hidden fill sizes="32px" className="object-cover" />
      </span>
      <span className="min-w-0">
        {/* The name links to them when we have a profile. Their words are on
            the page under their name, so being able to check who said it is
            the least the page owes them. */}
        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-fine font-bold underline decoration-dotted underline-offset-2 hover:decoration-solid"
          >
            {name}
          </a>
        ) : (
          <span className="block truncate text-fine font-bold">{name}</span>
        )}
        {role && <span className="block truncate text-[10px]">{role}</span>}
      </span>
    </div>
  );
}

/** How long ago, in the same shorthand the shipped comments use. */
function ago(at: number): string {
  const mins = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour`;
  return `${Math.round(hours / 24)} day`;
}

function Thread({ comment }: { comment: Comment }) {
  const guestbook = useGuestbook();
  const mine = guestbook.reactions[comment.id] ?? [];
  const replies = guestbook.replies[comment.id] ?? [];

  return (
    <li className="flex flex-col gap-2 border-b border-dashed border-kitchen-surface/25 pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <Author {...comment.author} />
        <CommentBody body={comment.body} />
        <CommentActions
          commentId={comment.id}
          author={comment.author.name}
          reactions={comment.reactions}
          mine={mine}
          postedAt={comment.postedAt}
        />
      </div>

      {/* Praise's answer, indented under the comment it belongs to. */}
      <div className="ml-3 flex flex-col gap-1 border-l border-dashed border-kitchen-surface/25 pl-2">
        <Author
          name="Praise Fabilola"
          avatar="/assets/brand/praise-avatar.webp"
          size={18}
        />
        <p className="text-fine text-pretty">
          <span className="rounded-(--radius-chip) bg-kitchen-surface px-1 py-px text-kitchen-ink">
            @{comment.author.name}
          </span>{" "}
          {comment.reply.body}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-fine">
          <span>{comment.reply.postedAt}</span>
        </div>
      </div>

      {/*
        Anything this visitor wrote, in the same indent as Praise's reply but
        badged. The badge is not decoration: without it a returning visitor
        cannot tell their own note from the real thread, and a screenshot of
        this panel would misrepresent what people actually said about him.
      */}
      {replies.map((r) => (
        <div
          key={r.id}
          className="ml-3 flex flex-col gap-1 border-l border-dashed border-kitchen-surface/25 pl-2"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-fine font-bold">You</span>
            <span className="chip [--chip-h:14px] border-kitchen-surface/40 px-1 text-[9px]">
              only on this device
            </span>
          </div>
          <p className="text-fine text-pretty">{r.body}</p>
          <div className="mt-0.5 flex items-center gap-2 text-fine">
            <span>{ago(r.at)}</span>
            <button
              type="button"
              onClick={() => removeReply(comment.id, r.id)}
              className="cursor-pointer underline decoration-dotted underline-offset-2 hover:decoration-solid"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
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
      className="flex max-h-[46vh] flex-col gap-3 overflow-y-auto pr-1 text-kitchen-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kitchen-surface"
    >
      {COMMENTS.map((c) => (
        <Thread key={c.id} comment={c} />
      ))}
    </ul>
  );
}
