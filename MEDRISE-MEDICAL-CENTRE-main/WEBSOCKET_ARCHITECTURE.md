# MedRise Medical Centre – WebSocket Architecture Documentation

**Project:** MedRise Medical Centre  
**Last Updated:** 2026-06-13  
**WebSocket Endpoint:** `/ws`  
**Protocol:** WebSocket (ws:// or wss://)

---

## Overview

The WebSocket system provides real-time notifications to connected admin/staff users. It enables live updates for appointments, patient feedback, queue status changes, and other critical events without requiring page refreshes.

---

## Architecture Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │         │   Backend    │         │  Database   │
│  (React)    │         │  (Express)   │         │ (PostgreSQL)│
└──────┬──────┘         └──────┬───────┘         └─────────────┘
       │                        │                        │
       │  1. Connect with token │                        │
       ├───────────────────────>│                        │
       │                        │                        │
       │  2. Validate session   │                        │
       │                        ├───────────────────────>│
       │                        │<───────────────────────│
       │                        │                        │
       │  3. Connection OK     │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │  4. Receive updates    │                        │
       │<───────────────────────│                        │
       │                        │                        │
```

---

## Connection Lifecycle

### 1. Connection Establishment

**Frontend:**
```typescript
const ws = new WebSocket(`wss://medrise-api-v8iz.onrender.com/ws?token=${sessionToken}`);
```

**Backend:**
```typescript
wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  const token = url.searchParams.get("token");
  const session = await resolveSession(token);
  if (!session) {
    ws.close(4003, "Invalid or expired token");
    return;
  }
  clients.set(ws, { adminId: session.id, username: session.username });
});
```

**Process:**
1. Frontend initiates WebSocket connection with session token
2. Backend validates token against session store
3. If valid, connection established and client added to active clients
4. If invalid, connection closed with error code

### 2. Message Reception

**Frontend:**
```typescript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === "notification") {
    showNotification(data.data);
  }
};
```

**Backend:**
```typescript
export function broadcast(notification: PushNotification): void {
  const msg = JSON.stringify({ event: "notification", data: notification });
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else {
      clients.delete(ws);
    }
  }
};
```

### 3. Connection Termination

**Types:**
- **Normal Close:** Client disconnects gracefully
- **Error Close:** Network error, server error
- **Token Expired:** Session invalid
- **Server Shutdown:** Server restart

**Backend Handling:**
```typescript
ws.on("close", () => {
  clients.delete(ws);
  logger.debug({ adminId: session.id }, "WebSocket client disconnected");
});

ws.on("error", (err) => {
  logger.warn({ err, adminId: session.id }, "WebSocket client error");
  clients.delete(ws);
});
```

---

## Authentication Flow

### Token-Based Authentication

**1. User Logs In:**
- User authenticates via `/api/admin/login` or `/api/staff/login`
- Backend validates credentials
- Backend creates session and returns token

**2. Token Storage:**
- Frontend stores token in localStorage
- Token format: 96-character hex string

**3. WebSocket Connection:**
- Frontend includes token in WebSocket URL: `?token=...`
- Backend validates token against session store
- Valid sessions allow connection
- Invalid sessions rejected with error code 4003

**4. Session Validation:**
```typescript
export async function resolveSession(token: string): Promise<SessionData | null> {
  // Check in-memory cache first
  if (cache.has(token)) return cache.get(token)!;
  
  // Check database
  const [row] = await db.select()...where(eq(sessionsTable.token, token));
  if (!row) return null;
  
  // Check expiration
  if (row.expiresAt < new Date()) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    return null;
  }
  
  // Cache for future requests
  cache.set(token, data);
  return data;
}
```

---

## Authorization Flow

### Role-Based Access

**Current Implementation:**
- All authenticated users receive all notifications
- No role-based filtering at WebSocket level
- Filtering happens at API level for data access

**Roles:**
- `medical_director`: Full access
- `admin`: Full access
- `owner`: Full access
- `doctor`: Staff access
- `nurse`: Staff access
- `receptionist`: Staff access
- `pharmacist`: Staff access
- `lab_technician`: Staff access
- `billing_officer`: Staff access
- `records_officer`: Staff access
- `staff`: Staff access

**Future Enhancement:**
- Implement role-based notification filtering
- Send only relevant notifications based on user role
- Department-specific notifications

---

## Reconnection Strategy

### Current State
**No automatic reconnection implemented**

**Issue:** If connection drops, user must manually refresh page to reconnect

### Recommended Reconnection Logic

**Frontend Implementation:**
```typescript
function connectWebSocket(token: string) {
  const ws = new WebSocket(`wss://medrise-api-v8iz.onrender.com/ws?token=${token}`);
  
  ws.onclose = (event) => {
    if (event.code !== 1000) {
      // Unexpected close, attempt reconnection
      setTimeout(() => connectWebSocket(token), 1000);
    }
  };
  
  ws.onerror = () => {
    // Error occurred, attempt reconnection with backoff
    setTimeout(() => connectWebSocket(token), 2000);
  };
}
```

**Exponential Backoff:**
- First attempt: 1 second
- Second attempt: 2 seconds
- Third attempt: 4 seconds
- Fourth attempt: 8 seconds
- Maximum: 30 seconds

---

## Scalability Considerations

### Current Limitations

**In-Memory Client Map:**
- All connected clients stored in JavaScript Map
- Lost on server restart
- No horizontal scaling support
- Single server only

**Session Cache:**
- In-memory Map for session caching
- Lost on server restart
- No distributed cache

### Free-Tier Scalability

**Current Capacity:**
- Render free tier: 512MB RAM
- Estimated concurrent connections: 50-100
- Suitable for current scale (100 daily users)

**Future Scaling Options:**
- **Option A:** Render Redis free tier (25MB)
  - Store client connections in Redis
  - Enable horizontal scaling
  - Cost: FREE
  - Limitations: 25MB memory

- **Option B:** Database-backed client storage
  - Store connections in PostgreSQL
  - Cost: FREE (uses existing database)
  - Limitations: Slower, adds database load

- **Option C:** Keep current implementation
  - Accept single-server limitation
  - Cost: FREE
  - Limitations: No horizontal scaling

**Recommendation:** Option C for current scale, upgrade to Option A if needed

---

## Reliability Features

### Current Implementation

**Error Handling:**
- Connection errors logged
- Invalid tokens rejected
- Stale connections pruned during broadcast

**Logging:**
```typescript
logger.info({ adminId: session.id, username: session.username, total: clients.size }, "WebSocket client connected");
logger.debug({ adminId: session.id, remaining: clients.size }, "WebSocket client disconnected");
logger.warn({ err, adminId: session.id }, "WebSocket client error");
```

**Pruning:**
- Stale connections removed during broadcast
- Error triggers immediate removal

### Missing Features

**Heartbeat/Ping-Pong:**
- Not implemented
- Dead connections not detected until broadcast
- Should implement for better reliability

**Message Acknowledgment:**
- Not implemented
- No guarantee of message delivery
- Should implement for critical notifications

**Message Queue:**
- Not implemented
- Messages lost if client offline
- Should implement for offline support

---

## Notification Types

### Current Notification Types

**Appointment Notifications:**
- New appointment request
- Appointment confirmed
- Appointment cancelled
- Appointment reminder

**Patient Feedback:**
- New patient feedback
- Rating updates

**Queue Status:**
- Patient checked in
- Patient in consultation
- Patient moved to nursing
- Patient moved to theatre
- Visit complete

**Lab Results:**
- Lab results ready
- Critical lab results

### Notification Data Structure

```typescript
interface PushNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  severity: string;
  relatedId: number | null;
  createdAt: string;
}
```

---

## Security Considerations

### Token Security

**Current Implementation:**
- Token passed in query parameter: `?token=...`
- Exposed in server logs
- Exposed in browser history

**Security Risk:** MEDIUM

**Recommendation:** Move token to WebSocket subprotocol or custom header

**Improved Implementation:**
```typescript
const ws = new WebSocket(`wss://medrise-api-v8iz.onrender.com/ws`, ["medrise-token", token]);
```

### Connection Security

**Current Implementation:**
- Uses wss:// (secure WebSocket)
- TLS encryption
- No additional authentication

**Security Status:** GOOD

### Rate Limiting

**Current Implementation:**
- No rate limiting on WebSocket connections
- Vulnerable to connection flood attacks

**Security Risk:** MEDIUM

**Recommendation:** Implement connection rate limiting

---

## Monitoring

### Current Monitoring

**Logging:**
- Connection events logged
- Disconnection events logged
- Error events logged
- Client count tracked

**Metrics Tracked:**
- Total connected clients
- Connection events
- Disconnection events
- Error events

### Recommended Monitoring

**Metrics to Add:**
- Connection duration
- Message count per connection
- Reconnection attempts
- Failed connection attempts
- Broadcast latency

**Free-Tier Monitoring:**
- Render built-in logs (7-day retention)
- GitHub Actions logs (for backups)
- Manual log review

---

## Free-Tier Limitations

### Render Free Tier
- **RAM:** 512MB
- **CPU:** Shared
- **Connections:** No hard limit, but practical limit ~100 concurrent
- **Uptime:** Not guaranteed (may spin down)

### WebSocket-Specific Limitations
- **No horizontal scaling** (single server)
- **No persistent connections** across restarts
- **No message queue** for offline clients
- **No heartbeat** for dead connection detection

---

## Future Improvements

### Priority 1 (High)
1. Implement automatic reconnection with exponential backoff
2. Move token from query parameter to subprotocol
3. Implement heartbeat/ping-pong for dead connection detection

### Priority 2 (Medium)
4. Implement message acknowledgment
5. Add connection rate limiting
6. Implement role-based notification filtering

### Priority 3 (Low)
7. Implement message queue for offline clients
8. Add Redis for distributed client storage
9. Implement WebSocket compression

---

## Troubleshooting

### Issue: Connection refused
**Cause:** Backend not running or WebSocket endpoint not configured
**Solution:** Check Render service status, verify `/ws` path

### Issue: Invalid token error (4003)
**Cause:** Token expired or invalid
**Solution:** User must log in again to get new token

### Issue: Connection drops frequently
**Cause:** Network instability or server restart
**Solution:** Implement reconnection logic (not currently implemented)

### Issue: No notifications received
**Cause:** Not connected to WebSocket or notification not broadcast
**Solution:** Check browser console for WebSocket errors, verify backend logs

---

## Contact Information

**WebSocket Implementation:** `artifacts/api-server/src/lib/ws.ts`  
**Frontend WebSocket Client:** `artifacts/medrise/src/lib/auth.tsx`  
**Session Management:** `artifacts/api-server/src/lib/session.ts`

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-06-13 | 1.0 | Initial WebSocket architecture documentation | Cascade |

---

**Next Review Date:** 2026-09-13 (Quarterly review recommended)
