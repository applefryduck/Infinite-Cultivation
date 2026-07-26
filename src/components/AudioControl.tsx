import { useState } from 'react'
import { getAudioSettings, setMuted, setVolume, playSfx } from '../game/audio'

export function AudioControl() {
  const initial = getAudioSettings()
  const [muted, setMutedState] = useState(initial.muted)
  const [volume, setVolumeState] = useState(initial.volume)

  return (
    <div className="audio-control">
      <button
        className="audio-btn"
        onClick={() => {
          const next = !muted
          setMuted(next)
          setMutedState(next)
          if (!next) playSfx('click')
        }}
        title={muted ? '開啟音效' : '靜音'}
        aria-label={muted ? '開啟音效' : '靜音'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <input
        className="audio-slider"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        disabled={muted}
        onChange={(e) => {
          const v = Number(e.target.value)
          setVolume(v)
          setVolumeState(v)
        }}
        onMouseUp={() => !muted && playSfx('click')}
        aria-label="音量"
      />
    </div>
  )
}
