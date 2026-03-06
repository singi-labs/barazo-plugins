// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { DefaultSignatureField } from '../DefaultSignatureField.js'

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

describe('DefaultSignatureField', () => {
  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<DefaultSignatureField />)
    expect(screen.getByText('Loading default signature...')).toBeInTheDocument()
  })

  it('loads existing default signature', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: 'My PDS sig' }))

    render(<DefaultSignatureField />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('My PDS sig')
    })
  })

  it('shows 3000-char counter', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404))

    render(<DefaultSignatureField />)

    await waitFor(() => {
      expect(screen.getByText('3000 / 3000 characters remaining')).toBeInTheDocument()
    })
  })

  it('saves to PDS on button click', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const user = userEvent.setup()

    render(<DefaultSignatureField />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    await user.type(screen.getByRole('textbox'), 'Default sig')
    await user.click(screen.getByRole('button', { name: 'Save Default' }))

    await waitFor(() => {
      expect(screen.getByText('Default signature saved to your PDS')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ext/signatures/default',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ text: 'Default sig' }),
      })
    )
  })

  it('shows error on save failure', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse({ error: 'AT Proto unavailable' }, 503))
    const user = userEvent.setup()

    render(<DefaultSignatureField />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    await user.type(screen.getByRole('textbox'), 'Test')
    await user.click(screen.getByRole('button', { name: 'Save Default' }))

    await waitFor(() => {
      expect(screen.getByText('AT Proto unavailable')).toBeInTheDocument()
    })
  })

  it('disables save when empty', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404))

    render(<DefaultSignatureField />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Default' })).toBeDisabled()
    })
  })

  it('mentions PDS in the description', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404))

    render(<DefaultSignatureField />)

    await waitFor(() => {
      expect(screen.getByText(/Personal Data Server/)).toBeInTheDocument()
    })
  })
})
