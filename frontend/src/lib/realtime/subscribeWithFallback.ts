import type { RealtimeChannel } from '@supabase/supabase-js'

type LiveStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

export function subscribeWithFallback(args: {
  channel: RealtimeChannel
  onRefresh: () => void | Promise<void>
  removeChannel: (channel: RealtimeChannel) => Promise<unknown>
  pollIntervalMs?: number
  startupFallbackMs?: number
}) {
  const {
    channel,
    onRefresh,
    removeChannel,
    pollIntervalMs = 10000,
    startupFallbackMs = 4000,
  } = args

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let startupTimer: ReturnType<typeof setTimeout> | null = null
  let isDisposed = false
  let isRealtimeHealthy = false

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const startPolling = () => {
    if (pollTimer || isDisposed) return
    pollTimer = setInterval(() => {
      void onRefresh()
    }, pollIntervalMs)
  }

  const onStatus = (status: LiveStatus) => {
    if (isDisposed) return

    if (status === 'SUBSCRIBED') {
      isRealtimeHealthy = true
      stopPolling()
      return
    }

    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      isRealtimeHealthy = false
      startPolling()
    }
  }

  channel.subscribe((status) => onStatus(status as LiveStatus))

  startupTimer = setTimeout(() => {
    if (!isRealtimeHealthy) {
      startPolling()
    }
  }, startupFallbackMs)

  return async () => {
    isDisposed = true
    stopPolling()
    if (startupTimer) {
      clearTimeout(startupTimer)
      startupTimer = null
    }
    await removeChannel(channel)
  }
}
