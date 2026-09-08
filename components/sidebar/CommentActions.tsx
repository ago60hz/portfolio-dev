"use client";

import { useState } from "react";
import { SmilePlus } from "lucide-react";
import type { Reaction } from "@/content/comments";
import { addReply, toggleReaction, type GuestReply } from "@/lib/guestbook";
import { cn } from "@/lib/utils";

/**
 * The palette offered when a visitor opens the reaction picker.
 *
 * Six, and no search: this is a sidebar panel, not a chat client. The first
 * four are the ones the thread already uses, so a visitor agreeing with a
 * comment lands on the pill that is already there and increments it rather than
 * starting a second pill that means the same thing.
 */
const PALETTE = ["🔥", "👏", "🙌", "💜", "😂", "👀"] as const;

/** A pill per emoji: the shipped counts, plus whatever this visitor added. */
export function ReactionPills({
  reactions,
  mine,
  onToggle,
}: {
  reactions: Reaction[];
  mine: string[];
  onToggle?: (emoji: string) => void;
}) {
  const base = new Map(reactions.map((r) => [r.emoji, r.count]));
  for (const e of mine) base.set(e, (base.get(e) ?? 0) + 1);

  return (
    <>
      {[...base].map(([emoji, count]) => {
        const picked = mine.includes(emoji);
        const label = `${picked ? "Remove your" : "Add a"} ${emoji} reaction`;
        const className = cn(
          "chip [--chip-h:16px] gap-0.5 px-1 text-[10px]",
          picked
            ? "border-kitchen-surface bg-kitchen-surface text-kitchen-ink"
            : "border-kitchen-surface/40",
          onToggle && "cursor-pointer",
        );
        const content = (
          <>
            <span aria-hidden>{emoji}</span>
            <span className="tabular">{count}</span>
          </>
        );
        // Praise's own replies carry no picker, so those pills stay inert
        // spans rather than becoming buttons that do nothing.
        return onToggle ? (
          <button
            key={emoji}
            type="button"
            aria-pressed={picked}
            aria-label={label}
            onClick={() => onToggle(emoji)}
            className={className}
          >
            {content}
          </button>
        ) : (
          <span key={emoji} className={className}>
            {content}
          </span>
        );
      })}
    </>
  );
}

/**
 * Reactions, the reply composer, and the offer to share what was just written.
 *
 * Everything here writes to `lib/guestbook`, which is this browser and nothing
 * else -- see the note there. The share link is the only route off the device,
 * and it is a link the visitor chooses to follow, not a post made for them.
 */
export function CommentActions({
  commentId,
  author,
  reactions,
  mine,
  postedAt,
}: {
  commentId: string;
  author: string;
  reactions: Reaction[];
  mine: string[];
  postedAt: string;
}) {
  const [picking, setPicking] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  /** The reply just posted, so the share offer is about that one exactly. */
  const [shared, setShared] = useState<GuestReply | null>(null);

  const post = () => {
    const reply = addReply(commentId, draft);
    if (!reply) return;
    setDraft("");
    setComposing(false);
    setShared(reply);
  };

  const shareHref = shared
    ? `https://x.com/intent/post?${new URLSearchParams({
        text: `“${shared.body}” — on ${author}'s comment about Praise Fabilola`,
        url: typeof window === "undefined" ? "" : window.location.origin,
      })}`
    : "";

  return (
    <div className="mt-1.5 flex flex-col gap-1.5 text-fine">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-expanded={picking}
          aria-label="Add a reaction"
          onClick={() => setPicking((v) => !v)}
          className="hit-32 shrink-0 cursor-pointer"
        >
          <SmilePlus aria-hidden className="size-3.5" />
        </button>

        <ReactionPills
          reactions={reactions}
          mine={mine}
          onToggle={(emoji) => toggleReaction(commentId, emoji)}
        />

        <button
          type="button"
          onClick={() => setComposing((v) => !v)}
          className="cursor-pointer underline decoration-dotted underline-offset-2 hover:no-underline"
        >
          Reply
        </button>

        <span aria-hidden className="h-3 w-px bg-kitchen-surface/25" />
        <span>{postedAt}</span>
      </div>

      {picking && (
        <div className="flex flex-wrap gap-1">
          {PALETTE.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React with ${emoji}`}
              onClick={() => {
                toggleReaction(commentId, emoji);
                setPicking(false);
              }}
              className="chip [--chip-h:20px] cursor-pointer border-kitchen-surface/40 px-1.5 text-[12px] hover:bg-kitchen-surface hover:text-kitchen-ink"
            >
              <span aria-hidden>{emoji}</span>
            </button>
          ))}
        </div>
      )}

      {composing && (
        <div className="flex flex-col gap-1">
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Reply to ${author}…`}
            aria-label={`Reply to ${author}`}
            className="w-full resize-y rounded-(--radius-chip) border border-dashed border-kitchen-surface/40 bg-transparent p-1.5 text-fine text-kitchen-surface placeholder:text-kitchen-surface/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kitchen-surface"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={post}
              disabled={!draft.trim()}
              className="chip [--chip-h:18px] cursor-pointer border-kitchen-surface bg-kitchen-surface px-2 text-kitchen-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Post
            </button>
            <span className="text-[10px]">Saved in this browser only.</span>
          </div>
        </div>
      )}

      {shared && (
        <div className="flex items-center gap-2">
          <a
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="chip [--chip-h:18px] border-kitchen-surface px-2 hover:bg-kitchen-surface hover:text-kitchen-ink"
          >
            Share on X
          </a>
          <button
            type="button"
            onClick={() => setShared(null)}
            className="cursor-pointer text-[10px] underline underline-offset-2"
          >
            No thanks
          </button>
        </div>
      )}
    </div>
  );
}
