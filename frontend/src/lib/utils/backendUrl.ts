const DEFAULT_BACKEND_URL = 'http://localhost:8001'

export function getBackendUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
  const legacyApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  const baseUrl = configured || legacyApiUrl || DEFAULT_BACKEND_URL
  return baseUrl.replace(/\/$/, '')
}

export function getBackendEndpoint(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getBackendUrl()}${normalizedPath}`
}
