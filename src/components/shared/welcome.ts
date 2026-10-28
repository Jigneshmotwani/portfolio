import { useEffect } from 'react'
import { content } from '../../data/content'
import { readJSON, writeJSON } from '../../lib/storage'
import { useNotifications } from '../../state/notifications'

const KEY = 'jos.welcomeShown'

function delaySeconds(): number {
  try {
    const override = new URLSearchParams(window.location.search).get('welcome')
    if (override != null && override !== '' && Number.isFinite(Number(override))) return Math.max(0, Number(override))
  } catch {
    /* ignore */
  }
  return content.site.welcomeNotificationDelay
}

/**
 * Call from the shell once the desktop / home screen is visible. Shows the
 * "Jignesh sent you a message 👋" banner once per session, after
 * content.site.welcomeNotificationDelay seconds (?welcome=<s> overrides).
 */
export function useWelcomeNotification(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || readJSON(KEY, false, 'session')) return
    const timer = window.setTimeout(() => {
      if (readJSON(KEY, false, 'session')) return
      writeJSON(KEY, true, 'session')
      const { welcomeMessage } = content.site
      useNotifications.getState().push({
        appId: 'mail',
        title: welcomeMessage.title,
        body: welcomeMessage.body,
        action: { appId: 'mail', params: { to: content.contact.email, subject: welcomeMessage.subject } },
      })
    }, delaySeconds() * 1000)
    return () => window.clearTimeout(timer)
  }, [enabled])
}
