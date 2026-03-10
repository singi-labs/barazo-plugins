// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { PostSignature } from '../PostSignature'

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

describe('PostSignature', () => {
  it('renders nothing when no authorDid', () => {
    const { container } = render(<PostSignature />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when signature not found', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Not found' }, 404))

    const { container } = render(<PostSignature authorDid="did:plc:test" />)

    // Wait for fetch to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    expect(container.querySelector('aside')).toBeNull()
  })

  it('renders signature when found', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ text: 'Open web enthusiast', source: 'community' })
    )

    render(<PostSignature authorDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByText('Open web enthusiast')).toBeInTheDocument()
    })

    expect(screen.getByRole('complementary', { name: 'User signature' })).toBeInTheDocument()
  })

  it('renders dashed separator', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: 'Test sig', source: 'pds_default' }))

    render(<PostSignature authorDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByText('Test sig')).toBeInTheDocument()
    })

    const hr = screen.getByRole('complementary', { name: 'User signature' }).querySelector('hr')
    expect(hr).toBeInTheDocument()
    expect(hr).toHaveAttribute('aria-hidden', 'true')
  })

  it('hides when isFirstByAuthor is false', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: 'Should not show', source: 'community' }))

    const { container } = render(<PostSignature authorDid="did:plc:test" isFirstByAuthor={false} />)

    // Wait for fetch to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    expect(container.querySelector('aside')).toBeNull()
  })

  it('shows when isFirstByAuthor is true', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: 'First post sig', source: 'community' }))

    render(<PostSignature authorDid="did:plc:test" isFirstByAuthor={true} />)

    await waitFor(() => {
      expect(screen.getByText('First post sig')).toBeInTheDocument()
    })
  })

  it('shows when isFirstByAuthor is undefined (default behavior)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ text: 'Default show', source: 'pds_default' }))

    render(<PostSignature authorDid="did:plc:test" />)

    await waitFor(() => {
      expect(screen.getByText('Default show')).toBeInTheDocument()
    })
  })

  it('fetches with encoded DID', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 404))

    render(<PostSignature authorDid="did:plc:abc123" />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/ext/signatures/did%3Aplc%3Aabc123')
    })
  })
})
