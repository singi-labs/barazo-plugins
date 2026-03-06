'use client'

import { useState, useEffect, useCallback } from 'react'

interface CommunitySignatureFieldProps {
  communityDid?: string
}

export function CommunitySignatureField({ communityDid }: CommunitySignatureFieldProps) {
  const [text, setText] = useState('')
  const [maxChars, setMaxChars] = useState(200)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchSignature = useCallback(async () => {
    if (!communityDid) return
    try {
      const res = await fetch('/api/ext/signatures/community', { credentials: 'include' })
      if (res.ok) {
        const data = (await res.json()) as { text: string; maxCharacters?: number }
        setText(data.text)
        if (typeof data.maxCharacters === 'number') {
          setMaxChars(data.maxCharacters)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [communityDid])

  useEffect(() => {
    void fetchSignature()
  }, [fetchSignature])

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/ext/signatures/community', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        setStatus({ type: 'success', message: 'Signature saved' })
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

  const handleUseDefault = async () => {
    setStatus(null)
    try {
      const res = await fetch('/api/ext/signatures/default', { credentials: 'include' })
      if (res.ok) {
        const data = (await res.json()) as { text: string }
        setText(data.text)
      } else {
        setStatus({ type: 'error', message: 'No default signature found' })
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error' })
    }
  }

  if (loading) {
    return <div aria-busy="true">Loading signature...</div>
  }

  const charsRemaining = maxChars - text.length

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Community Signature</legend>
      <p className="text-xs text-muted-foreground">
        Your signature appears below your posts in this community.
      </p>
      <div>
        <label htmlFor="community-signature" className="sr-only">
          Signature text
        </label>
        <textarea
          id="community-signature"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          maxLength={maxChars}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setStatus(null)
          }}
          placeholder="Enter your signature..."
          aria-describedby="community-sig-counter"
        />
        <div
          id="community-sig-counter"
          className={`text-xs ${charsRemaining < 20 ? 'text-destructive' : 'text-muted-foreground'}`}
          aria-live="polite"
        >
          {charsRemaining} characters remaining
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          onClick={() => void handleSave()}
          disabled={saving || text.length === 0}
        >
          {saving ? 'Saving...' : 'Save Signature'}
        </button>
        <button
          type="button"
          className="rounded-md border border-input px-3 py-1.5 text-sm"
          onClick={() => void handleUseDefault()}
        >
          Use my default
        </button>
      </div>
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
