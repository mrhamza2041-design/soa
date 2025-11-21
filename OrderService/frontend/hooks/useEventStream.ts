import { useEffect, useRef, useState } from "react";
import type { NotificationMessage } from "@/lib/api";

type EventStreamOptions = {
  url?: string;
  enabled?: boolean;
};

const DEFAULT_URL =
  process.env.NEXT_PUBLIC_NOTIFICATIONS_URL ??
  "http://localhost:5103/notifications/stream";

export function useNotificationStream({
  url = DEFAULT_URL,
  enabled = true,
}: EventStreamOptions = {}) {
  const [events, setEvents] = useState<NotificationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const eventSource = new EventSource(url);
    sourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError(new Error("Notification stream disconnected"));

      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
    };

    eventSource.onmessage = (message) => {
      try {
        const payload: NotificationMessage = JSON.parse(message.data);
        setEvents((prev) =>
          [...prev.filter((evt) => evt.id !== payload.id), payload]
            .sort(
              (a, b) =>
                new Date(b.sentAt).getTime() -
                new Date(a.sentAt).getTime(),
            )
            .slice(0, 20),
        );
      } catch (parseError) {
        console.error("Failed to parse notification", parseError);
      }
    };

    return () => {
      eventSource.close();
      sourceRef.current = null;
    };
  }, [enabled, url]);

  return { events, isConnected, error };
}

