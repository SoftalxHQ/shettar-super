import { createConsumer, type Consumer, type Subscription } from "@rails/actioncable";
import type { SupportMessage, SupportTicket } from "@/lib/store/services/api";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

export type SupportAdminCableEvent =
  | { type: "ticket_created"; ticket: SupportTicket }
  | { type: "ticket_updated"; ticket: SupportTicket }
  | {
      type: "new_message";
      ticket_id: string;
      support_ticket_id?: number;
      message: SupportMessage;
    };

export function supportCableUrl(token: string): string {
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  return `${wsBase}/cable?token=${encodeURIComponent(token)}`;
}

export function subscribeSupportAdminChannel(
  token: string,
  handlers: {
    received: (data: SupportAdminCableEvent) => void;
    connected?: () => void;
    disconnected?: () => void;
    rejected?: () => void;
  }
): { consumer: Consumer; subscription: Subscription } {
  const consumer = createConsumer(supportCableUrl(token));
  const subscription = consumer.subscriptions.create(
    { channel: "SupportChannel" },
    {
      received(data: SupportAdminCableEvent) {
        handlers.received(data);
      },
      connected() {
        handlers.connected?.();
      },
      disconnected() {
        handlers.disconnected?.();
      },
      rejected() {
        handlers.rejected?.();
      },
    }
  );

  return { consumer, subscription };
}
