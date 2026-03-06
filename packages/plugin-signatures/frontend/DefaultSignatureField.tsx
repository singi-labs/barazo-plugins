'use client'

import { useState, useEffect } from 'react'

const PDS_MAX_CHARS = 3000

export function DefaultSignatureField() {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ext/signatures/default', { credentials: 'include' })
        if (res.ok) {
          const data = (await res.json()) as { text: string }
          setText(data.text)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/ext/signatures/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        setStatus({ type: 'success', message: 'Default signature saved to your PDS' })
      } else {
        const err = (await res.json()) as { error?: string }
        setStatus({ type: 'error', message: err.error ?? 'Failed to save signature' })
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div aria-busy="true">Loading default signature...</div>
  }

  const charsRemaining = PDS_MAX_CHARS - text.length

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Default Signature (PDS)</legend>
      <p className="text-xs text-muted-foreground">
        Your default signature is stored on your Personal Data Server and shared across all Barazo
        communities. Communities may enforce a lower character limit.
      </p>
      <div>
        <label htmlFor="default-signature" className="sr-only">
          Default signature text
        </label>
        <textarea
          id="default-signature"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          maxLength={PDS_MAX_CHARS}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setStatus(null)
          }}
          placeholder="Enter your default signature..."
          aria-describedby="default-sig-counter"
        />
        <div
          id="default-sig-counter"
          className={`text-xs ${charsRemaining < 100 ? 'text-destructive' : 'text-muted-foreground'}`}
          aria-live="polite"
        >
          {charsRemaining} / {PDS_MAX_CHARS} characters remaining
        </div>
      </div>
      <button
        type="button"
        className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        onClick={() => void handleSave()}
        disabled={saving || text.length === 0}
      >
        {saving ? 'Saving...' : 'Save Default'}
      </button>
      {status && (
        <p
          role="status"
          className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600'}`}
        >
          {status.message}
        </p>
      )}
    </fieldset>
  )
}
