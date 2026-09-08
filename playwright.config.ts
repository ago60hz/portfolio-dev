import { defineConfig, devices, type Project } from "@playwright/test";

/** The four widths the design has to hold up at. */
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

/**
 * Explicitly typed: without it the spread of the mapped viewports and the
 * hand-written motion project widen into a union TypeScript will not accept as
 * a project list.
 */
const projects: Project[] = [
  ...Object.entries(VIEWPORTS).map(([name, viewport]) => ({
    name,
    use: {
      ...devices["Desktop Chrome"],
      viewport,
      // Via contextOptions, not the bare `reducedMotion` key: that one is
      // typed but never reaches the page in this version -- the page still
      // reported prefers-reduced-motion: no-preference. Verified with
      // matchMedia rather than assumed.
      contextOptions: { reducedMotion: "reduce" as const },
    },
    testIgnore: /motion\.spec\.ts/,
  })),
  // Motion, at full strength, desktop only.
  {
    name: "motion",
    testMatch: /motion\.spec\.ts/,
    use: {
      ...devices["Desktop Chrome"],
      viewport: VIEWPORTS.desktop,
      reducedMotion: "no-preference" as const,
    },
  },
];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  /**
   * Capped since the kitchen got a WebGL radio. Every worker stands up its own
   * three.js context and pays a one-time scene-init stall for it; at
   * Playwright's default (half the cores) that contention pushed
   * timing-sensitive specs -- the filter exit transition, the axe sweeps, the
   * canvas-sized poll -- past their thresholds, and they passed again the
   * moment they ran alone. Slower, but the suite means something.
   */
  workers: process.env.CI ? 2 : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    /*
     * Overridable, because port 3000 is not always ours. A `next dev` left
     * running by another session holds it, `npm run start` then fails to bind
     * with EADDRINUSE, and the suite silently runs against that dev server
     * instead -- which reports dev-only React warnings as console errors and
     * fails "boots clean" for reasons that have nothing to do with the build.
     *
     *   PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test
     */
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    /**
     * The whole suite runs with motion reduced.
     *
     * Every spec here is about layout, content or behaviour, and none of them
     * asked for a loading animation in front of it. Reduced motion drops the
     * loader's minimum display time to zero and its entrance transforms with
     * it, so specs reach the room immediately and assert against a settled
     * page rather than racing a transition. visual.spec.ts already set this
     * file-wide for the same reason; this hoists it.
     *
     * The one spec that is about motion opts back out -- see the `motion`
     * project below. Set per project rather than here: the top-level `use`
     * type does not carry context options.
     */
  },
  projects,
  // Production build, never the dev server — dev-mode timing and bundle size
  // both lie, and this suite exists to catch exactly those.
  //
  // `reuseExistingServer` used to be `!process.env.CI`, which quietly undid
  // that. Playwright cannot tell a dev server from a production one; it only
  // checks whether `url` answers. So with `next dev` already on :3000 the whole
  // suite ran against dev and said nothing, and the results were wrong in both
  // directions: it invented fourteen failures that do not exist in production
  // (the dev overlay's markup, and per-request rendering instead of the
  // build-time prerender), and it would just as happily hide a real one.
  //
  // Always false. A local run pays for its own build, which is the price of the
  // sentence above this one being true.
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
