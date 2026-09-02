import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Radio3D } from './Radio3D'
import { useRadio } from './hooks/useRadio'
import './demo.css'

/** Small debug readout so state is visible while testing. */
function Panel({ radio }: { radio: ReturnType<typeof useRadio> }) {
  return (
    <dl className="panel">
      <dt>power</dt><dd>{radio.state.power}</dd>
      <dt>playback</dt><dd>{radio.state.playback}</dd>
      <dt>track</dt><dd>{radio.meta.index + 1} / {radio.meta.total}</dd>
      <dt>title</dt><dd className="title">{radio.meta.title || '—'}</dd>
      <dt>player</dt><dd>{radio.ready ? 'ready' : 'loading'}</dd>
      {radio.state.notice && (<><dt>notice</dt><dd>{radio.state.notice}</dd></>)}
    </dl>
  )
}

function App() {
  const [showPanel, setShowPanel] = useState(true)
  // One instance, shared: the panel reads the same radio the scene renders.
  const radio = useRadio()
  return (
    <main>
      <header>
        <h1>IJO&nbsp;DISCO</h1>
        <p>Press <strong>○</strong> to switch on. <strong>▲ ▼</strong> change track, <strong>▶❙❙</strong> plays and pauses.</p>
      </header>
      <div className="stage">
        <Radio3D radio={radio} />
      </div>
      <footer>
        <button type="button" onClick={() => setShowPanel((v) => !v)}>
          {showPanel ? 'Hide' : 'Show'} state
        </button>
      </footer>
      {showPanel && <Panel radio={radio} />}
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
