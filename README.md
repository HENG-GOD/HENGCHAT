# HENGCHAT — Multi-OA LINE Shared Inbox

Production-style chat management platform that connects multiple **LINE Official Accounts** to a single shared inbox dashboard.

## Stack

- **Backend**: NestJS · Prisma · PostgreSQL · Redis · BullMQ · Socket.IO
- **Frontend**: Next.js (App Router) · TypeScript · Tailwind · React Query · Zustand
- **Storage**: S3-compatible (MinIO in dev)
- **Auth**: JWT (access + refresh), role-based access control (owner / admin / supervisor / agent)

## Layout

```
backend/   NestJS API + queue workers + Socket.IO gateway
frontend/  Next.js dashboard (App Router)
docker-compose.yml  Full local stack (Postgres, Redis, MinIO, backend, frontend)
.env.example        Copy to .env, edit, then run
```

## Quick start (Docker, end-to-end)

```bash
cp .env.example .env
# Generate a real encryption key:
#   openssl rand -hex 32
# Paste it as ENCRYPTION_KEY in .env. Also change all JWT secrets.

docker compose up --build
```

Then (in another shell), run the migration & seed:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

Open:

- Dashboard: <http://localhost:3000>
- API health: <http://localhost:4000/api/auth/me> (requires token)
- MinIO console: <http://localhost:9001> (minioadmin / minioadmin)

Default login from seed:

```
owner@hengchat.local / ChangeMe!2026
```

## Local dev (without Docker)

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Frontend (new shell)
cd frontend
npm install
npm run dev
```

Make sure Postgres, Redis and an S3-compatible store are running locally and `.env` points to them.

## Connecting a LINE Official Account

1. In the dashboard, go to **Channels → Add channel** and paste:
   - **Channel ID** — the LINE bot's user ID (the value LINE sends as `destination` in webhooks)
   - **Channel secret**
   - **Channel access token** (long-lived)
2. In the LINE Developers Console for that bot, set the webhook URL to:
   ```
   https://YOUR_PUBLIC_HOST/webhook/line/<channelId>
   ```
   (Per-channel routing — the URL parameter selects which OA the request belongs to. The generic `/webhook/line` endpoint is also accepted and routes by the `destination` field, but per-channel URLs are clearer and reduce ambiguity.)
3. Enable webhooks in the LINE Console and turn off "Auto-reply messages."

Secrets are AES-256-GCM encrypted with `ENCRYPTION_KEY` before being written to the database.

## Architecture

```
LINE ─► /webhook/line/:channelId
            │ verify x-line-signature (raw body)
            │ upsert WebhookEvent (idempotent on lineMessageId/eventId)
            │ enqueue BullMQ job
            ▼
    webhook-events queue ─► WebhookProcessor
            │ resolves correct channel + token
            │ findOrCreate Contact (lineChannelId, lineUserId)
            │ findOrCreate open Conversation (per channel)
            │ insert Message (+ download media → S3 → MessageAttachment)
            │ emit `message:new` over Socket.IO
            ▼
    Frontend (joined to workspace room + conversation room) updates live

Agent reply ─► POST /api/messages/send
            │ insert outbound Message (status=pending)
            │ enqueue outbound-messages job
            ▼
    outbound-messages queue ─► OutboundProcessor
            │ load channel.accessToken (decrypted)
            │ call LINE Messaging API push
            │ persist MessageSendLog
            │ flip Message.sendStatus + emit `message:sent`/`message:failed`
```

## Multi-OA invariants

- `Contact (lineChannelId, lineUserId)` is unique — the same LINE user reaching out via two of your OAs becomes two contacts (this is intentional; they live in different channels).
- Every `Conversation` is bound to exactly one `LineChannel`. Outbound sends always look up the conversation's channel and use **that channel's** decrypted token. Tokens never cross channels.
- `Message` carries both `lineChannelId` and `conversationId`. Dedup unique key: `(lineChannelId, lineMessageId)`.

## Security

- AES-256-GCM at rest for channel secrets and access tokens (`ENCRYPTION_KEY`).
- LINE signature verified using raw request body (`x-line-signature` HMAC-SHA256, timing-safe compare).
- argon2id password hashing.
- Global `JwtAuthGuard` + per-handler `RolesGuard` with `@Roles(...)`.
- ThrottlerModule rate limiter on all routes.
- Sanitized error responses via `AllExceptionsFilter`.

## Reliability

- BullMQ exponential backoff: webhook jobs 5 attempts, outbound 3 attempts.
- WebhookEvent table is the canonical audit trail; processing is idempotent via the `(lineChannelId, eventId)` unique constraint and `Message (lineChannelId, lineMessageId)` unique constraint.
- Inbound webhook handler returns 200 fast — heavy work is queued.

## Roadmap (post-core)

- Quick replies / canned responses
- Chatbot automation hooks
- SLA timers + assignment rules
- AI-assisted reply suggestions
- Broadcast / segmentation
- Deeper analytics
