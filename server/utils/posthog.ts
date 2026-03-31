import type { H3Event } from 'h3'
import { PostHog } from 'posthog-node'

let client: PostHog | null = null

function getClient(event: H3Event): PostHog | null {
  if (client)
    return client
  const { posthogApiKey, posthogHost } = useRuntimeConfig(event)
  if (!posthogApiKey)
    return null
  client = new PostHog(posthogApiKey, {
    host: posthogHost || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  return client
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function captureRedirectEvent(
  event: H3Event,
  ip: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const ph = getClient(event)
  if (!ph || !ip)
    return

  const distinctId = await hashIp(ip)

  ph.capture({
    distinctId,
    event: 'link_clicked',
    properties: {
      $process_person_profile: false,
      ...properties,
    },
  })
}
