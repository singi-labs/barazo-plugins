'use client'

import { useState, useEffect } from 'react'

interface PostSignatureProps {
  authorDid?: string
  isFirstByAuthor?: boolean
}

interface SignatureData {
  text: string
  source: 'community' | 'pds_default'
}

export function PostSignature({ authorDid, isFirstByAuthor }: PostSignatureProps) {
  const [signature, setSignature] = useState<SignatureData | null>(null)

  useEffect(() => {
    if (!authorDid) return

    const load = async () => {
      try {
        const res = await fetch(`/api/ext/signatures/${encodeURIComponent(authorDid)}`)
        if (res.ok) {
          const data = (await res.json()) as SignatureData
          setSignature(data)
        }
      } catch {
        // Silently fail -- missing signature is not an error
      }
    }
    void load()
  }, [authorDid])

  if (!signature) return null

  // When display mode is first_per_thread, only show on first post by this author
  // The isFirstByAuthor prop is computed by the host application
  if (isFirstByAuthor === false) return null

  return (
    <aside aria-label="User signature" className="mt-3 pt-2">
      <hr aria-hidden="true" className="mb-2 border-dashed border-border" />
      <p className="text-xs text-muted-foreground">{signature.text}</p>
    </aside>
  )
}
