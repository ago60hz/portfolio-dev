import { describe, it, expect } from 'vitest'
import { reduce, initialState, BOOT_MS } from '../src/core/radioMachine'
import type { RadioState } from '../src/core/types'

const LEN = 13

function boot(state: RadioState): RadioState {
  let s = reduce(state, { type: 'POWER' }, LEN).state
  s = reduce(s, { type: 'BOOT_DONE' }, LEN).state
  return s
}

describe('radioMachine', () => {
  it('rejects transport controls while off', () => {
    const off = initialState()
    expect(reduce(off, { type: 'PLAY_PAUSE' }, LEN).state).toBe(off)
    expect(reduce(off, { type: 'NEXT' }, LEN).state).toBe(off)
    expect(reduce(off, { type: 'PREV' }, LEN).state).toBe(off)
  })

  it('POWER boots then plays, with a power-on sound and a load effect', () => {
    const { state: booting, effects } = reduce(initialState(), { type: 'POWER' }, LEN)
    expect(booting.power).toBe('booting')
    expect(effects).toContainEqual({ type: 'SOUND', voice: 'powerOn' })
    expect(effects).toContainEqual({ type: 'PROVIDER_LOAD', index: 0 })

    const { state: playing, effects: bootEffects } = reduce(booting, { type: 'BOOT_DONE' }, LEN)
    expect(playing.power).toBe('on')
    expect(bootEffects).toContainEqual({ type: 'PROVIDER_PLAY' })
  })

  it('takes ~BOOT_MS to boot, by contract', () => {
    expect(BOOT_MS).toBeGreaterThan(0)
  })

  it('PLAY_PAUSE toggles playing <-> paused', () => {
    let s = boot(initialState())
    s = reduce(s, { type: 'PROVIDER_STATE', state: 'playing' }, LEN).state
    const paused = reduce(s, { type: 'PLAY_PAUSE' }, LEN)
    expect(paused.state.playback).toBe('paused')
    expect(paused.effects).toContainEqual({ type: 'PROVIDER_PAUSE' })

    const resumed = reduce(paused.state, { type: 'PLAY_PAUSE' }, LEN)
    expect(resumed.effects).toContainEqual({ type: 'PROVIDER_PLAY' })
  })

  it('NEXT/PREV wrap at both ends of the track list', () => {
    let s = boot(initialState(LEN - 1)) // last track
    s = reduce(s, { type: 'NEXT' }, LEN).state
    expect(s.trackIndex).toBe(0) // wrapped forward

    s = reduce(s, { type: 'PREV' }, LEN).state
    expect(s.trackIndex).toBe(LEN - 1) // wrapped backward
  })

  it('power-off pauses and returns to off', () => {
    const s = boot(initialState())
    const { state: off, effects } = reduce(s, { type: 'POWER' }, LEN)
    expect(off.power).toBe('off')
    expect(effects).toContainEqual({ type: 'PROVIDER_PAUSE' })
    expect(effects).toContainEqual({ type: 'SOUND', voice: 'powerOff' })
  })

  it('trackIndex survives a power cycle', () => {
    let s = boot(initialState())
    s = reduce(s, { type: 'NEXT' }, LEN).state
    s = reduce(s, { type: 'NEXT' }, LEN).state
    expect(s.trackIndex).toBe(2)

    s = reduce(s, { type: 'POWER' }, LEN).state // off
    expect(s.trackIndex).toBe(2)

    s = boot(s) // on again
    expect(s.trackIndex).toBe(2)
  })

  it('a blocked video (PROVIDER_ERROR) skips forward rather than dying', () => {
    const s = boot(initialState())
    const { state: next, effects } = reduce(s, { type: 'PROVIDER_ERROR' }, LEN)
    expect(next.trackIndex).toBe(1)
    expect(next.notice).toBeTruthy()
    expect(effects).toContainEqual({ type: 'PROVIDER_LOAD', index: 1 })
  })

  it('TRACK_ENDED advances to the next track and keeps playing', () => {
    const s = boot(initialState())
    const { state: next } = reduce(s, { type: 'TRACK_ENDED' }, LEN)
    expect(next.trackIndex).toBe(1)
    expect(next.playback).toBe('buffering')
  })
})
