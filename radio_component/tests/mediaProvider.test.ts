import { describe, it, expect, vi } from 'vitest'
import { createProviderFor } from '../src/media/createProvider'
import { YouTubeProvider } from '../src/media/YouTubeProvider'
import { AudioFileProvider } from '../src/media/AudioFileProvider'
import type { Track } from '../src/core/types'

describe('createProviderFor', () => {
  it('resolves a youtube provider for a youtube track', () => {
    const track: Track = { kind: 'youtube', id: 'abc123' }
    expect(createProviderFor(track)).toBeInstanceOf(YouTubeProvider)
  })

  it('resolves a file provider for a file track', () => {
    const track: Track = { kind: 'file', src: '/audio/a.m4a' }
    expect(createProviderFor(track)).toBeInstanceOf(AudioFileProvider)
  })
})

describe('MediaProvider contract, exercised against YouTubeProvider', () => {
  it('mounts, loads and plays in the order the machine drives it', async () => {
    const provider = new YouTubeProvider()
    const host = document.createElement('div')
    await provider.mount(host)

    const calls: string[] = []
    const player = (provider as any).player
    // PLAYLIST_ID is set in station.ts, so loadTrack always cues (never
    // auto-plays) — play is a separate, explicit call.
    vi.spyOn(player, 'cuePlaylist').mockImplementation(() => calls.push('load'))
    vi.spyOn(player, 'playVideo').mockImplementation(() => calls.push('play'))
    vi.spyOn(player, 'pauseVideo').mockImplementation(() => calls.push('pause'))

    // power -> load, play
    provider.loadTrack(0)
    provider.play()
    // next -> load, play
    provider.loadTrack(1)
    provider.play()
    // pause
    provider.pause()

    expect(calls).toEqual(['load', 'play', 'load', 'play', 'pause'])
    provider.destroy()
  })

  it('propagates provider state changes to subscribers', async () => {
    const provider = new YouTubeProvider()
    const host = document.createElement('div')
    await provider.mount(host)

    const seen: string[] = []
    provider.subscribe((state) => seen.push(state))

    const player = (provider as any).player
    const onStateChange = player._opts.events.onStateChange
    onStateChange({ data: 1 }) // PLAYING
    onStateChange({ data: 2 }) // PAUSED

    expect(seen).toEqual(['playing', 'paused'])
    provider.destroy()
  })
})
