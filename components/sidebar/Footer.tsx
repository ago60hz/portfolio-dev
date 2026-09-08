export function Footer() {
  return (
    // Wraps rather than crushes: at the 248px tablet rail both halves broke to
    // two lines and ran into each other.
    <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 p-3">
      <span className="text-fine">Praise Fabilola / jo&rsquo;disco. 2026</span>
      <a
        href="#"
        className="text-fine underline underline-offset-2 hover:no-underline"
      >
        Read my Stories
      </a>
    </div>
  );
}
