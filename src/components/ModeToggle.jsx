import React from 'react'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle">
      <button
        type="button"
        aria-pressed={mode === 'live'}
        className={`mode-toggle__option${mode === 'live' ? ' mode-toggle__option--active' : ''}`}
        onClick={() => onChange('live')}
      >
        Live
      </button>
      <button
        type="button"
        aria-pressed={mode === 'demo'}
        className={`mode-toggle__option${mode === 'demo' ? ' mode-toggle__option--active' : ''}`}
        onClick={() => onChange('demo')}
      >
        Demo
      </button>
    </div>
  )
}
