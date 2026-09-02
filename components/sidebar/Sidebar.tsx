import { Brand } from "./Brand";
import { Bio } from "./Bio";
import { FilterChips } from "./FilterChips";
import { Accordions } from "./Accordions";
import { Footer } from "./Footer";

/**
 * The inner panel. Border weight is asymmetric by design — 2px on the bottom
 * against 1px elsewhere, which reads as a slight lift off the page.
 */
export function Sidebar() {
  return (
    <div className="flex h-full w-full flex-col justify-between overflow-y-auto rounded-md border border-b-2 border-kitchen-ink bg-kitchen-purple">
      <Brand />
      <Bio />
      <FilterChips />
      <Accordions />
      <Footer />
    </div>
  );
}
