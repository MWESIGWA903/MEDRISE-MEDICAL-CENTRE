import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { resolveSession } from "./session";
import { logger } from "./logger";

export interface PushNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  severity: string;
  relatedId: number | null;
  createdAt: string;
}

interface ConnectedClient {
  adminId: number;
  username: string;
}

const clients = new Map<WebSocket, ConnectedClient>();

export function broadcast(notification: PushNotification): void {
  const msg = JSON.stringify({ event: "notification", data: notification });
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else {
      clients.delete(ws);
      logger.debug({ adminId: client.adminId }, "Pruned stale WebSocket client during broadcast");
    }
  }
}

export function setupWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "/ws", "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "Missing token");
      return;
    }

    const session = await resolveSession(token);
    if (!session) {
      ws.close(4003, "Invalid or expired token");
      return;
    }

    clients.set(ws, { adminId: session.id, username: session.username });
    logger.info({ adminId: session.id, username: session.username, total: clients.size }, "WebSocket client connected");

    ws.on("close", () => {
      clients.delete(ws);
      logger.debug({ adminId: session.id, remaining: clients.size }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ err, adminId: session.id }, "WebSocket client error");
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ event: "connected", data: { message: "WebSocket connected" } }));
  });

  logger.info("WebSocket server attached at /ws");
}
