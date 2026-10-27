/**
 * Notification Sound & Browser Push Notification Utility
 * Sri Kathiravan & Co. Management Portal
 * Supports:
 * 1. Web Audio API synthesized melodious chimes (zero external audio file dependency, 100% reliable)
 * 2. HTML5 Web Notifications API for native OS / browser alerts
 * 3. Settings persistence in localStorage (Sound ON/OFF, Melody Type, Volume, Browser Push ON/OFF)
 * 4. Multi-role support for Admin, Staff, and Client
 */

// Global AudioContext singleton
let audioContextInstance = null;

/**
 * Returns the shared AudioContext instance.
 * @param {boolean} createIfMissing - Only create when needed or during user gesture
 */
function getAudioContext(createIfMissing = false) {
  if (typeof window === "undefined") return null;
  if (!audioContextInstance && createIfMissing) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      try {
        audioContextInstance = new AudioCtx();
      } catch {
        // Safe fallback if browser disallows context creation
      }
    }
  }
  return audioContextInstance;
}

// Exported helper to unlock AudioContext on deliberate user gestures (e.g. opening sound settings)
export const unlockAudio = async () => {
  try {
    const ctx = getAudioContext(true);
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx ? ctx.state === "running" : false;
  } catch {
    return false;
  }
};

/* ==========================================================================
   Sound Configuration & Persistence
   ========================================================================== */
export const SOUND_SETTINGS_KEYS = {
  SOUND_ENABLED: "skc_notif_sound_enabled",
  SOUND_TYPE: "skc_notif_sound_type",
  SOUND_VOLUME: "skc_notif_sound_volume",
  BROWSER_ENABLED: "skc_browser_notif_enabled",
};

export const SOUND_TYPES = [
  { id: "chime", name: "Executive Chime (Default)", description: "Crisp, elegant two-tone notification" },
  { id: "bell", name: "Crystal Bell", description: "Pleasant harmonic chime triad" },
  { id: "warm", name: "Subtle Warm", description: "Soft, gentle dual-frequency alert" },
  { id: "digital", name: "Digital Modern", description: "Contemporary short tech alert" },
];

export const isSoundEnabled = () => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_SETTINGS_KEYS.SOUND_ENABLED) !== "false";
};

export const setSoundEnabled = (enabled) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_SETTINGS_KEYS.SOUND_ENABLED, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("skc-sound-settings-changed", { detail: { soundEnabled: enabled } }));
};

export const getSoundType = () => {
  if (typeof window === "undefined") return "chime";
  return localStorage.getItem(SOUND_SETTINGS_KEYS.SOUND_TYPE) || "chime";
};

export const setSoundType = (type) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_SETTINGS_KEYS.SOUND_TYPE, type);
  window.dispatchEvent(new CustomEvent("skc-sound-settings-changed", { detail: { soundType: type } }));
};

export const getSoundVolume = () => {
  if (typeof window === "undefined") return 0.7;
  const val = parseFloat(localStorage.getItem(SOUND_SETTINGS_KEYS.SOUND_VOLUME));
  return isNaN(val) ? 0.7 : Math.max(0.1, Math.min(1, val));
};

export const setSoundVolume = (vol) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_SETTINGS_KEYS.SOUND_VOLUME, String(vol));
  window.dispatchEvent(new CustomEvent("skc-sound-settings-changed", { detail: { soundVolume: vol } }));
};

/* ==========================================================================
   Web Audio Synthesizer Engine
   ========================================================================== */
export const playNotificationSound = async (forcedType = null, forcePlay = false) => {
  if (!forcePlay && !isSoundEnabled()) {
    return false;
  }

  // Prevent browser autoplay warnings if user has not interacted with document yet
  if (typeof navigator !== "undefined" && navigator.userActivation && !navigator.userActivation.hasBeenActive) {
    return false;
  }

  try {
    const ctx = getAudioContext(true);
    if (!ctx) return false;

    // If context is suspended, attempt resume
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }

    if (ctx.state !== "running") {
      return false;
    }

    const soundType = forcedType || getSoundType();
    const volumeLevel = getSoundVolume();
    const baseGainValue = 0.28 * volumeLevel;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(baseGainValue, now);
    masterGain.connect(ctx.destination);

    if (soundType === "bell") {
      // 3-note crystal bell chime (E5: 659.25Hz, G#5: 830.61Hz, B5: 987.77Hz, E6: 1318.51Hz)
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        noteGain.gain.setValueAtTime(0, now + idx * 0.08);
        noteGain.gain.linearRampToValueAtTime(1, now + idx * 0.08 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.55);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } else if (soundType === "warm") {
      // Warm, mellow dual-tone (440Hz -> 554.37Hz)
      [
        { freq: 440, delay: 0, duration: 0.4 },
        { freq: 554.37, delay: 0.1, duration: 0.45 },
      ].forEach(({ freq, delay, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + delay);

        noteGain.gain.setValueAtTime(0, now + delay);
        noteGain.gain.linearRampToValueAtTime(0.9, now + delay + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.05);
      });
    } else if (soundType === "digital") {
      // Digital pop/pip modern alert
      [
        { freq: 880, delay: 0, duration: 0.12 },
        { freq: 1760, delay: 0.09, duration: 0.22 },
      ].forEach(({ freq, delay, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);

        noteGain.gain.setValueAtTime(0.8, now + delay);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.02);
      });
    } else {
      // Default: Executive Chime (D5: 587.33Hz -> A5: 880Hz)
      [
        { freq: 587.33, delay: 0, duration: 0.35 },
        { freq: 880, delay: 0.12, duration: 0.55 },
      ].forEach(({ freq, delay, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);

        noteGain.gain.setValueAtTime(0, now + delay);
        noteGain.gain.linearRampToValueAtTime(1, now + delay + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.05);
      });
    }

    return true;
  } catch (err) {
    console.warn("Unable to play synthesized notification sound:", err);
    return false;
  }
};

/* ==========================================================================
   Browser Desktop Push Notification Helpers
   ========================================================================== */
export const isBrowserNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

export const getBrowserNotificationPermission = () => {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const isBrowserNotificationEnabled = () => {
  if (!isBrowserNotificationSupported()) return false;
  const pref = localStorage.getItem(SOUND_SETTINGS_KEYS.BROWSER_ENABLED);
  return pref === "true" && Notification.permission === "granted";
};

export const requestBrowserNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem(SOUND_SETTINGS_KEYS.BROWSER_ENABLED, "true");
    } else if (permission === "denied") {
      localStorage.setItem(SOUND_SETTINGS_KEYS.BROWSER_ENABLED, "false");
    }
    window.dispatchEvent(
      new CustomEvent("skc-sound-settings-changed", {
        detail: { browserPermission: permission, browserEnabled: permission === "granted" },
      })
    );
    return permission;
  } catch (err) {
    console.warn("Permission request failed:", err);
    return "denied";
  }
};

export const setBrowserNotificationEnabled = async (enabled) => {
  if (!isBrowserNotificationSupported()) return false;

  if (enabled) {
    if (Notification.permission === "granted") {
      localStorage.setItem(SOUND_SETTINGS_KEYS.BROWSER_ENABLED, "true");
    } else {
      const perm = await requestBrowserNotificationPermission();
      if (perm !== "granted") {
        return false;
      }
    }
  } else {
    localStorage.setItem(SOUND_SETTINGS_KEYS.BROWSER_ENABLED, "false");
  }

  window.dispatchEvent(
    new CustomEvent("skc-sound-settings-changed", {
      detail: { browserEnabled: enabled },
    })
  );
  return true;
};

export const sendBrowserNotification = (title, options = {}) => {
  if (!isBrowserNotificationSupported()) return null;
  if (!isBrowserNotificationEnabled()) return null;
  if (Notification.permission !== "granted") return null;

  try {
    const notification = new Notification(title || "Sri Kathiravan & Co.", {
      body: options.body || "You have a new update in the portal.",
      icon: options.icon || "/skc-sub-logo.png",
      badge: "/skc-sub-logo.png",
      tag: options.tag || "skc-portal-alert",
      renotify: true,
      silent: true, // We handle our own pleasant audio chime
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("Could not dispatch browser notification:", err);
    return null;
  }
};

/* ==========================================================================
   Combined Notification Dispatcher
   ========================================================================== */
export const triggerNotificationArrivalAlert = ({
  title = "Sri Kathiravan & Co.",
  body = "You have received a new notification alert.",
  url = null,
  count = 1,
} = {}) => {
  // 1. Play audio chime if sound is enabled
  playNotificationSound();

  // 2. Dispatch native desktop notification if enabled
  sendBrowserNotification(title, {
    body,
    url,
  });

  // 3. Dispatch broadcast window event so any open notification lists can update instantly
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("skc-notification-arrived", {
        detail: { title, body, url, count },
      })
    );
  }
};
