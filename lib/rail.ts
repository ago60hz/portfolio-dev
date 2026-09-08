/**
 * Progress-rail geometry (35:338).
 *
 * Pure, so the rail's arithmetic can be tested without a scroll container or a
 * layout. The component only measures the DOM and hands the numbers here.
 *
 * The model comes from commissioner.design/work/grain, which Praise gave as the
 * reference. Three things happen at once, and the first two were missed on a
 * first reading because a static snapshot of that page hides them:
 *
 *   1. Ticks FILL as you read. Everything above the playhead is drawn at full
 *      strength, everything below is faint.
 *   2. A BUMP travels with the playhead: width peaks there and tapers back to
 *      base over about seven ticks in each direction.
 *   3. Section ticks are permanently longer than their neighbours.
 *
 * Praise's sketch draws the rail scrolled to the top, which is why its opening
 * looked like a fixed decorative ramp. It is the bump, parked at tick 0.
 */

export const PITCH = 11;
const BASE = 10;
const SECTION = 29;
/** The bump's peak width, and how many ticks it takes to fall back to base. */
const PEAK = 40;
const REACH = 7;

/** Ticks follow the height available at the design's pitch, so the rail models
 *  this page rather than the fixed 17 the sketch happened to draw. */
export const tickCount = (height: number) =>
  Math.max(2, Math.floor(height / PITCH) + 1);

/** Where a section sits on the rail: its share of the way down the article. */
export const tickFor = (offsetTop: number, total: number, count: number) =>
  total <= 0 ? 0 : Math.min(count - 1, Math.max(0, Math.round((offsetTop / total) * (count - 1))));

/**
 * A tick's width: the longest of what it is and where the reader is.
 *
 * Taking the max rather than summing is what keeps a section tick under the
 * playhead from growing into something much longer than either rule implies.
 */
export const tickWidth = (i: number, sections: number[], playhead: number) => {
  const own = sections.includes(i) ? SECTION : BASE;
  const bump = PEAK - (Math.abs(i - playhead) * (PEAK - BASE)) / REACH;
  return Math.round(Math.max(own, bump));
};

/** Has the reader passed this tick? Drives the fill. */
export const isRead = (i: number, playhead: number) => i < playhead;

/**
 * Which section is current, given each heading's offset and the scroll line.
 *
 * The line sits a third of the way down the viewport rather than at its top
 * edge: switching exactly at the edge makes the label flicker back and forth
 * while a heading rests on the boundary.
 */
export const activeSection = (tops: number[], line: number) => {
  let active = 0;
  tops.forEach((top, i) => { if (top <= line) active = i; });
  return active;
};

/** The reader's position on the rail, as a tick index. */
export const playheadFor = (scrollTop: number, scrollHeight: number, clientHeight: number, count: number) => {
  const max = Math.max(1, scrollHeight - clientHeight);
  return Math.round((Math.min(scrollTop, max) / max) * (count - 1));
};
