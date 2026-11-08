/**
 * StudyBuddy (PeerApply Nexus) - In-House Web Notification & Audio System
 *
 * Provides native desktop notifications via ServiceWorkerRegistration.showNotification()
 * with fallback to Window.Notification constructor, plus a zero-asset Web Audio chime synthesizer.
 */

export interface DesktopNotificationOptions {
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  silent?: boolean;
  requireInteraction?: boolean;
}

/**
 * Synthesizes a pleasant two-tone chime (C5 523.25Hz -> E5 659.25Hz) using the Web Audio API.
 * Requires zero external audio files and executes with zero network latency.
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // Tone 2: E5 (659.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.48);

    // Clean up audio context
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 600);
  } catch (err) {
    console.warn('Web Audio chime playback failed:', err);
  }
}

/**
 * Returns current browser notification permission status.
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests browser notification permission. Must be triggered from a user gesture.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Desktop notification dispatcher:
 * 1. Checks if permission is 'granted'.
 * 2. Uses absolute raster PNG icon required by Windows Notification Service (WNS).
 * 3. Tries Service Worker showNotification() first.
 * 4. Falls back to window Notification constructor if Service Worker is unavailable.
 */
export async function sendDesktopNotification(
  title: string,
  options: DesktopNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Notification] Notifications not supported in this environment');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Notification] Notification permission is not granted:', Notification.permission);
    return false;
  }

  const iconUrl = new URL('/icon.png', window.location.origin).href;

  const notificationPayload: NotificationOptions = {
    body: options.body,
    tag: options.tag || `studybuddy-${Date.now()}`,
    icon: options.icon || iconUrl,
    badge: options.badge || iconUrl,
    requireInteraction: options.requireInteraction ?? true,
    data: options.data || { url: '/' },
  };

  // 1. Try Service Worker showNotification first (with short timeout so we never hang)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 250)),
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notificationPayload);
        console.log('[Notification] Displayed via Service Worker:', title);
        return true;
      }
    } catch (swErr) {
      console.warn('[Notification] Service Worker showNotification failed, trying fallback:', swErr);
    }
  }

  // 2. Direct Window Notification constructor fallback
  try {
    const notif = new Notification(title, notificationPayload);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    console.log('[Notification] Displayed via Window Notification:', title);
    return true;
  } catch (err) {
    console.error('[Notification] Direct Notification constructor failed:', err);
    return false;
  }
}

/**
 * Registers the root public/sw.js service worker.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
}
