import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Radio3D } from '../src/Radio3D'

// The WebGL scene never mounts in jsdom (no GL context) — this exercises
// exactly the accessible fallback path a screen reader or a no-WebGL browser
// actually uses, which is the point of testing this layer at all.

describe('Radio3D accessible controls', () => {
  it('renders the control row with power always enabled', () => {
    render(<Radio3D muted />)
    expect(screen.getByRole('button', { name: /power/i })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('disables transport controls while off', () => {
    render(<Radio3D muted />)
    for (const label of [/next track/i, /previous track/i, /play or pause/i]) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
  })

  it('enables transport controls once powered on', async () => {
    render(<Radio3D muted />)
    fireEvent.click(screen.getByRole('button', { name: /power/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /play or pause/i })).toHaveAttribute(
        'aria-disabled',
        'false',
      ),
    )
  })

  it('a disabled control does not dispatch', () => {
    render(<Radio3D muted />)
    // Should be a no-op: still off afterwards, provable via the live region
    // never claiming a track is playing.
    fireEvent.click(screen.getByRole('button', { name: /play or pause/i }))
    expect(screen.getByText(/off/i)).toBeInTheDocument()
  })
})
