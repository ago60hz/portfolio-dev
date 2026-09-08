"use client";

import { useSyncExternalStore } from "react";

/**
 * What a visitor has added to the Comments thread, kept in their own browser.
 *
 * There is no backend, and this is not pretending to be one. A reaction or a
 * reply written here is visible to the person who wrote it and to nobody else,
 * it survives a reload and a return visit, and it never leaves the device. The
 * thread's own testimonials are real words from real people; anything a visitor
 * adds is marked as theirs and stored apart from them, so the two can never be
 * confused for one another.
 *
 * `localStorage` rather than a cookie or the URL: it is per-origin, per-browser,
 * synchronous to read during render, and nothing here is worth sending anywhere.
 */

export type GuestReply = {
  id: string;
  body: string;
  /** Epoch ms. Rendered as a relative label so it ages correctly. */
  at: number;
};

export type Guestbook = {
  /** commentId -> the emoji this visitor picked. */
  reactions: Record<string, string[]>;
  /** commentId -> the replies this visitor wrote, oldest first. */
  replies: Record<string, GuestReply[]>;
};

const KEY = "jodisco:guestbook:v1";
const EMPTY: Guestbook = { reactions: {}, replies: {} };

/**
 * One frozen object for every empty read.
 *
 * `useSyncExternalStore` compares snapshots by identity and throws
 * "getSnapshot should be cached" into an infinite loop if a fresh object comes
 * back each time -- which is exactly what a `JSON.parse` on every call does. So
 * the parsed value is cached and only replaced when something writes.
 */
let cache: Guestbook = EMPTY;
let loaded = false;

const listeners = new Set<() => void>();

function read(): Guestbook {
  if (loaded) return cache;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Guestbook>;
      cache = {
        reactions: parsed.reactions ?? {},
        replies: parsed.replies ?? {},
      };
    }
  } catch {
    // Private browsing, a full quota, or a value from an older shape. An empty
    // guestbook is a perfectly good answer to all three.
  }
  return cache;
}

function write(next: Guestbook) {
  cache = next;
  loaded = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage refused it. The change still stands for this session rather than
    // being silently rolled back under the visitor.
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab writing the same key. Without this, two open tabs disagree
  // about what the visitor has already said.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    read();
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The server has no browser storage, so it renders the thread as it ships. */
const serverSnapshot = () => EMPTY;

export function useGuestbook(): Guestbook {
  return useSyncExternalStore(subscribe, read, serverSnapshot);
}

/** Adds the emoji if it is not there, removes it if it is. */
export function toggleReaction(commentId: string, emoji: string) {
  const state = read();
  const mine = state.reactions[commentId] ?? [];
  const next = mine.includes(emoji)
    ? mine.filter((e) => e !== emoji)
    : [...mine, emoji];
  write({
    ...state,
    reactions: { ...state.reactions, [commentId]: next },
  });
}

/** Returns the stored reply, so the caller can offer to share that exact text. */
export function addReply(commentId: string, body: string): GuestReply | null {
  const text = body.trim();
  if (!text) return null;
  const state = read();
  const reply: GuestReply = {
    id: `${commentId}-${Date.now()}`,
    body: text,
    at: Date.now(),
  };
  write({
    ...state,
    replies: {
      ...state.replies,
      [commentId]: [...(state.replies[commentId] ?? []), reply],
    },
  });
  return reply;
}

export function removeReply(commentId: string, replyId: string) {
  const state = read();
  write({
    ...state,
    replies: {
      ...state.replies,
      [commentId]: (state.replies[commentId] ?? []).filter((r) => r.id !== replyId),
    },
  });
}
