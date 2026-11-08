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

// Built-in inline SVG data URI icon so notifications never fail on missing files
const DEFAULT_NOTIFICATION_ICON = '/icon.svg';

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
    gain1.gain.setValueAtTime(0.12, now);
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
    gain2.gain.setValueAtTime(0.15, now + 0.12);
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
 * Hybrid desktop notification dispatcher:
 * 1. Checks if permission is 'granted'.
 * 2. Attempts Service Worker showNotification() with requireInteraction=true so it stays in the notification bar / Action Center.
 * 3. Falls back immediately to window Notification constructor if Service Worker is unavailable or slow.
 */
export async function sendDesktopNotification(
  title: string,
  options: DesktopNotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationPayload: NotificationOptions = {
    body: options.body,
    tag: options.tag || `studybuddy-alert-${Date.now()}`,
    icon: options.icon || DEFAULT_NOTIFICATION_ICON,
    badge: options.badge || DEFAULT_NOTIFICATION_ICON,
    requireInteraction: options.requireInteraction !== false, // Default true: stays in Windows Notification Center / Action Bar!
    silent: options.silent || false,
    data: options.data || { url: '/' },
  };

  // 1. Service Worker hybrid dispatch (preferred for background & OS notification bar handling)
  if ('serviceWorker' in navigator) {
    try {
      // Race against 1000ms timeout so we never hang if sw is not activated yet
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
      ]);

      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, notificationPayload);
        return true;
      }

      // If controller is active, postMessage fallback
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: notificationPayload,
        });
        return true;
      }
    } catch (swErr) {
      console.warn('Service Worker notification failed, trying fallback constructor:', swErr);
    }
  }

  // 2. Direct Window Notification constructor fallback
  try {
    const notif = new Notification(title, notificationPayload);

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (notifErr) {
    console.warn('Window Notification constructor failed:', notifErr);
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
