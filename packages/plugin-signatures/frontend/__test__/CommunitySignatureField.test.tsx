// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { CommunitySignatureField } from '../CommunitySignatureField'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  mockFetch.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('CommunitySignatureField', () => {
  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<CommunitySignatureField communityDid="did:plc:test" />)
    expect(screen.getByText('Loading signature...')).toBeInTheDocument()
  })

  it('loads existing signature on mount', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: 'My signature', maxCharacters: 200 }))

    render(<CommunitySignatureField communityDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('My signature')
    })
  })

  it('shows character counter', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: '', maxCharacters: 200 }))

    render(<CommunitySignatureField communityDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByText('200 characters remaining')).toBeInTheDocument()
    })
  })

  it('updates counter as user types', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: '', maxCharacters: 200 }))
    const user = userEvent.setup()

    render(<CommunitySignatureField communityDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    await user.type(screen.getByRole('textbox'), 'Hello')

    expect(screen.getByText('195 characters remaining')).toBeInTheDocument()
  })

  it('saves signature on button click', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ text: '' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const user = userEvent.setup()

    render(<CommunitySignatureField communityDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    await user.type(screen.getByRole('textbox'), 'New sig')
    await user.click(screen.getByRole('button', { name: 'Save Signature' }))

    await waitFor(() => {
      expect(screen.getByText('Signature saved')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ext/signatures/community',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ text: 'New sig' }),
      })
    )
  })

  it('shows error when save fails', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ text: '' }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Too long' }, 400))
    const user = userEvent.setup()

    render(<CommunitySignatureField communityDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    await user.type(screen.getByRole('textbox'), 'Test')
    await user.click(screen.getByRole('button', { name: 'Save Signature' }))

    await waitFor(() => {
      expect(screen.getByText('Too long')).toBeInTheDocument()
    })
  })

  it('loads default signature when "Use my default" is clicked', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ text: '' }))
      .mockResolvedValueOnce(jsonResponse({ text: 'PDS default sig' }))
    const user = userEvent.setup()

    render(<CommunitySignatureField communityDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Use my default' }))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('PDS default sig')
    })
  })

  it('disables save when textarea is empty', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: '' }))

    render(<CommunitySignatureField communityDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Signature' })).toBeDisabled()
    })
  })
})
