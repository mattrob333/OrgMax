// Chat cleanup utility for managing chat timeouts
// This can be called periodically to clean up inactive chats

export async function cleanupInactiveChats() {
  try {
    const response = await fetch('/api/chat/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Chat cleanup completed:', result.message)
      return result
    } else {
      console.error('Chat cleanup failed:', response.statusText)
      return null
    }
  } catch (error) {
    console.error('Error during chat cleanup:', error)
    return null
  }
}

// Optional: Set up automatic cleanup (can be enabled/disabled)
let cleanupInterval: NodeJS.Timeout | null = null

export function startAutomaticCleanup(intervalMinutes: number = 5) {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  
  cleanupInterval = setInterval(() => {
    cleanupInactiveChats()
  }, intervalMinutes * 60 * 1000)
  
  console.log(`Started automatic chat cleanup every ${intervalMinutes} minutes`)
}

export function stopAutomaticCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
    console.log('Stopped automatic chat cleanup')
  }
}

// Manually trigger cleanup (can be called from admin panel or settings)
export function triggerManualCleanup() {
  return cleanupInactiveChats()
}