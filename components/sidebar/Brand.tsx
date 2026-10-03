/**
 * The name lockup (1:376).
 *
 * "Praise Fabilola" is live Gochi Hand text -- the handoff hides the bitmap
 * layer in favour of the typeface, which also makes the name selectable and
 * indexable.
 */
export function Brand() {
  return (
    <div className="flex w-full shrink-0 items-center gap-2 border-b border-kitchen-ink px-4 py-2">
      <span className="font-gochi text-logo whitespace-nowrap text-kitchen-ink">
        Praise Fabilola
      </span>
    </div>
  );
}
