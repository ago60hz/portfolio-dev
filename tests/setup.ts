import "@testing-library/jest-dom/vitest";

/**
 * jsdom ships no matchMedia, and anything reading a media query through
 * usePrefersReducedMotion() throws on mount without it. Default to "motion is
 * fine", matching the hook's own server snapshot -- a test that cares about
 * the reduced case can override this per-test.
 */
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/**
 * jsdom ships no ResizeObserver either. `useSceneUnit` measures --u off a real
 * element and re-reads on resize, which is the only way to get a used value
 * out of a container query unit -- so anything rendering a can needs this.
 *
 * A no-op is the right stub: jsdom never resizes, so the callback would never
 * fire in a real implementation either. The initial read still happens.
 */
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof window.ResizeObserver;
}
