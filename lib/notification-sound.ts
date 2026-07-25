/** Support / notice sound preference + chime for Shettar Super. */

const STORAGE_KEY = "shettar_super_sound_enabled";

function readStoredPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw !== "false";
  } catch {
    return true;
  }
}

let soundEnabled = true;
const listeners = new Set<() => void>();

export function isNotificationSoundEnabled() {
  return soundEnabled;
}

export function setNotificationSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    /* private mode / quota */
  }
  listeners.forEach((fn) => fn());
}

export function hydrateNotificationSoundEnabled() {
  soundEnabled = readStoredPreference();
  return soundEnabled;
}

export function subscribeNotificationSoundEnabled(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Play a short two-tone chime (same tone as shettar-business notifications). */
export async function playNotificationTone() {
  if (!soundEnabled) return;

  try {
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    master.connect(ctx.destination);

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.55, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    playNote(880, now, 0.18);
    playNote(1174.66, now + 0.2, 0.28);

    window.setTimeout(() => {
      void ctx.close();
    }, 700);
  } catch {
    /* autoplay policy or unsupported environment */
  }
}
