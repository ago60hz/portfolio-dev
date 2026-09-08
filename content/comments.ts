/**
 * The Comments thread.
 *
 * The testimonials are REAL words from REAL people, supplied by Praise and
 * transcribed verbatim. Never paraphrase, trim or "tighten" them — a silent
 * edit misrepresents someone. `CommentsThread.test.tsx` asserts each one
 * renders in full for exactly that reason.
 */

export type Reaction = { emoji: string; count: number };

export type Comment = {
  id: string;
  author: {
    name: string;
    avatar: string;
    role?: string;
    /** Their LinkedIn profile. The name links to it when present. */
    linkedin?: string;
  };
  body: string;
  reactions: Reaction[];
  /** Relative label, as the reference draws it ("6 hour", "2 min"). */
  postedAt: string;
  reply: { body: string; postedAt: string };
};

/**
 * Reaction counts are editorial, not tracked. Nothing increments them and
 * there is no backend to read them from — they are set by hand to dress the
 * thread, the way the reference draws it.
 */
const FAKE = (...r: [string, number][]): Reaction[] =>
  r.map(([emoji, count]) => ({ emoji, count }));

/** Reviewed and approved by Praise. The replies are his voice. */
export const COMMENTS: Comment[] = [
  {
    id: "marco",
    author: {
      name: "Marco De Rossi",
      avatar: "/assets/avatars/marco-de-rossi.webp",
      linkedin: "https://www.linkedin.com/in/marcoderossi/",
      role: "Brought Praise into Hal (acquired by Consensys)",
    },
    body: "Praise is one of those rare designers who can combine strong design taste with exceptional speed of execution. He has an incredible eye for detail, but never lets perfection slow him down.\n\nI had the opportunity to bring Praise into Hal, which was later acquired by Consensys, and watched him quickly develop a deep understanding of the blockchain infrastructure and translate that complexity into exciting, thoughtful visual experiences. He played an important role in elevating our design and helping us communicate the product in ways that supported both product and marketing.\n\nHe has a great sense of the bigger picture, but still pays attention to the small details. He works quickly, thinks things through, and consistently delivers strong work.",
    reactions: FAKE(["🔥", 6], ["👏", 3]),
    postedAt: "6 hour",
    reply: {
      body: "Marco, thank you — this means a lot coming from you. Hal was where I learned that shipping fast and shipping carefully aren't opposites, and a lot of that came from watching how you ran things. Grateful you took the bet on me.",
      postedAt: "5 hour",
    },
  },
  {
    id: "tyreek",
    author: {
      name: "Tyreek Houston",
      avatar: "/assets/avatars/tyreek-houston.webp",
      linkedin: "https://www.linkedin.com/in/tyreek-houston-mlis-68022371/",
      role: "Founder",
    },
    body: "Praise had a transformative impact on my startup, aligning our business and brand into a seamless, strategic design that became the foundation for our product. He deeply understands problems before designing solutions and communicates transparently, often asynchronously with detailed updates. His work is thoughtful, high-quality, and truly elevates any project. I highly recommend Praise for any team or client in need of a skilled, impact-driven UX designer.",
    reactions: FAKE(["🙌", 4], ["💜", 2]),
    postedAt: "1 day",
    reply: {
      body: "Thank you Tyreek. Getting the business and the brand to say the same thing was the whole job, and you gave me the room to do it properly instead of just making screens. Proud of what we built.",
      postedAt: "22 hour",
    },
  },
  {
    id: "joshua",
    author: {
      name: "Joshua Tabansi",
      avatar: "/assets/avatars/joshua-tabansi.webp",
      linkedin: "https://www.linkedin.com/in/joshua-tabansi-0446b931/",
      role: "Led and mentored Praise",
    },
    body: "I had the pleasure of leading and mentoring Praise for over a year, and he stood out from the beginning for his exceptional product thinking and design taste. He has a rare ability to understand complex problems, listen deeply, and turn them into simple, thoughtful experiences.\n\nWhat impressed me most was how quickly he learned and how proactively he pushed himself beyond the brief i.e from mastering new tools to improving how we worked with developers. He's curious, collaborative, and genuinely passionate about technology and its potential across Africa. I'd happily recommend Praise to any team looking for a designer who can think deeply and execute exceptionally well.",
    reactions: FAKE(["🚀", 8], ["🙏", 2]),
    postedAt: "2 day",
    reply: {
      body: "Joshua, thank you. You were the first person to push me past the brief instead of just approving what was in it — that habit stuck, and it's most of how I work now. I owe a lot of this to that year.",
      postedAt: "2 day",
    },
  },
];
