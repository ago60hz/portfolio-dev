import '@testing-library/jest-dom/vitest'

// jsdom has no layout/media/observer APIs — stub the ones this project touches.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

if (!('IntersectionObserver' in window)) {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - jsdom stub
  window.IntersectionObserver = MockIntersectionObserver
}

// Minimal YT.Player double so YouTubeProvider.mount() resolves in jsdom.
;(window as any).YT = {
  PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 },
  Player: class {
    constructor(_el: unknown, opts: any) {
      queueMicrotask(() => opts.events?.onReady?.())
    }
    playVideo() {}
    pauseVideo() {}
    setVolume() {}
    cuePlaylist() {}
    cueVideoById() {}
    getVideoData() {
      return { title: 'Test Track' }
    }
    getPlaylist() {
      return null
    }
    destroy() {}
  },
}
