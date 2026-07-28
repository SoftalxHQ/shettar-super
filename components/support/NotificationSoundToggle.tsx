"use client";

import { useEffect, useState } from "react";
import {
  hydrateNotificationSoundEnabled,
  isNotificationSoundEnabled,
  playNotificationTone,
  setNotificationSoundEnabled,
  subscribeNotificationSoundEnabled,
} from "@/lib/notification-sound";

/** Local mute toggle for Super support/chat notice sounds. */
export default function NotificationSoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(hydrateNotificationSoundEnabled());
    return subscribeNotificationSoundEnabled(() =>
      setEnabled(isNotificationSoundEnabled())
    );
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setNotificationSoundEnabled(next);
    if (next) void playNotificationTone();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      title={enabled ? "Notification sound on" : "Notification sound muted"}
      aria-label={enabled ? "Mute notification sound" : "Enable notification sound"}
      aria-pressed={enabled}
    >
      {enabled ? (
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 10v4h3l5 5V5l-5 5H6z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      )}
    </button>
  );
}
