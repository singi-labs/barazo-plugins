import { z } from 'zod'

/**
 * Mirrors the forum.barazo.actor.signature lexicon constraints.
 * Once @singi-labs/lexicons is published to npm, import from there instead.
 */
export const signatureTextSchema = z.string().min(1).max(3000)

export const signatureInputSchema = z.object({
  text: signatureTextSchema,
})

export const didParamSchema = z.object({
  did: z.string().startsWith('did:'),
})
