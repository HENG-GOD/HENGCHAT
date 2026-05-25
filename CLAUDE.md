# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

HENGCHAT is a multi-LINE-OA shared inbox: it receives webhook events from many LINE Official Accounts, stores conversations centrally, and lets multiple agents reply through one dashboard. The system's core invariant is that **every contact, conversation, and message is bound to a specific `LineChannel`, and outbound sends use *that channel's* access token — tokens never cross channels.**

Two apps in one repo: `backend/` (NestJS) and `frontend/` (Next.js App Router). Wired together via REST `/api/*` + Socket.IO. PostgreSQL + Redis + S3-compatible storage. Local dev runs all of it via `docker-compose.yml` at the repo root.

## Commands

All paths below are relative to repo root unless noted. Most workflows have a Docker variant and a native variant — pick one and stick with it per session.

### Full stack (Docker, recommended for dev)

```powershell
docker compose up --build                            # boot postgres, redis, minio, backend, frontend
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed      # creates owner@hengchat.local / ChangeMe!2026
docker compose down                                  # stop (keeps volumes)
docker compose down -v                               # stop + wipe DB/storage
docker compose logs -f backend                       # tail logs
docker compose exec backend npx prisma studio        # DB GUI on :5555
```

### Backend (native, from `backend/`)

```powershell
npm install
npx prisma generate                # after editing schema.prisma
npx prisma migrate dev --name xxx  # dev migration (creates SQL + applies)
npm run prisma:seed
npm run start:dev                  # nest start --watch on :4000
npm run build && npm start
npm run lint
npm test                           # jest (no tests yet — scaffolded only)
```

### Frontend (native, from `frontend/`)

```powershell
npm install
npm run dev                        # next dev on :3000 (proxies /api → NEXT_PUBLIC_API_BASE_URL)
npm run build && npm start
npm run lint
```

### Secrets (required before first run)

Three secrets in `.env` must be replaced — the defaults will refuse to boot (`ENCRYPTION_KEY` validates 32-byte hex at runtime). Generate all three:

```powershell
function New-RandomHex($n) { $b = New-Object byte[] $n; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join "" }
"ENCRYPTION_KEY=$(New-RandomHex 32)"       # MUST be exactly 32 bytes (64 hex)
"JWT_SECRET=$(New-RandomHex 48)"
"JWT_REFRESH_SECRET=$(New-RandomHex 48)"
```

If `ENCRYPTION_KEY` changes after channels exist, all stored LINE secrets/tokens become undecryptable. Treat it like a master key.

## Architecture

### The webhook → queue → processor flow

This is the single most important flow to understand. Modifying any link without understanding the chain will break LINE integration.

```
LINE Platform
    │ POST {raw JSON body + x-line-signature header}
    ▼
backend/src/modules/webhooks/webhooks.controller.ts
    │ POST /webhook/line/:channelId  (NOT under /api prefix — see main.ts exclude)
    │ ① resolve channel via ChannelsService.getDecryptedByChannelId
    │ ② verifyLineSignature(channelSecret, rawBody, signature) — uses req.rawBody captured in main.ts
    │ ③ upsert WebhookEvent (unique on lineChannelId + eventId → idempotent)
    │ ④ enqueue BullMQ job, jobId = WebhookEvent.id
    │ ⑤ return 200 immediately (LINE retries hard on non-200)
    ▼
backend/src/modules/queues/webhook.processor.ts
    │ ① re-decrypt channel token
    │ ② findOrCreateContact (unique lineChannelId + lineUserId; fetches LINE profile if new)
    │ ③ findOrCreate open Conversation for (channel, contact)
    │ ④ create Message — Message.lineMessageId is unique per channel, so duplicate webhooks no-op
    │ ⑤ for media: LineService.downloadContent → StorageService.uploadBuffer → MessageAttachment
    │ ⑥ bump Conversation.unreadCount + lastMessageAt in one transaction
    │ ⑦ RealtimeGateway.emitConversation/emitWorkspace
```

Outbound is the mirror:

```
Agent UI → POST /api/messages/send
    │ MessagesService.send: insert Message(sendStatus=pending) + emit message:new (optimistic)
    │ enqueue outbound-messages job
    ▼
backend/src/modules/queues/outbound.processor.ts
    │ ① load message → conversation → resolve THAT conversation's channel token (decrypted)
    │ ② LineService.pushMessage
    │ ③ write MessageSendLog (always — for audit/debug)
    │ ④ flip Message.sendStatus to sent/failed, emit message:sent or message:failed
```

**When changing webhook or outbound logic:** the contract is that both paths converge on the same `Message` row, the same Socket.IO event names (see `common/constants/events.ts`), and the same channel-token resolution (`ChannelsService.getDecryptedById`). Don't fork.

### Multi-OA invariants (DO NOT violate)

These are enforced by Prisma schema constraints. Breaking them silently corrupts cross-tenant data.

- `Contact` is unique on `(lineChannelId, lineUserId)`. The same physical LINE user contacting two of your OAs is **two contacts**. This is intentional.
- `Message` is unique on `(lineChannelId, lineMessageId)`. Deduplicates LINE's "delivered twice" webhook retries.
- `WebhookEvent` is unique on `(lineChannelId, eventId)`. Idempotency at the entry point.
- Every `Conversation`/`Message` carries `lineChannelId`. Outbound code paths must resolve the token via the conversation's channel — never via the agent, never via "the default channel", never by caching the last token.

### Encryption boundary

`LineChannel.channelSecret` and `LineChannel.channelAccessToken` are stored AES-256-GCM encrypted (`common/utils/crypto.util.ts`).

- **Reading from DB directly returns ciphertext.** Always go through `ChannelsService.getDecryptedById` or `getDecryptedByChannelId` when you need to call LINE or verify a signature.
- The public `ChannelsService.list/get` deliberately omits these fields via the `serialize` helper. Never widen that shape.

### Realtime model

`RealtimeGateway` authenticates Socket.IO connections by verifying the same JWT the REST API uses. On connect it joins three rooms:

- `workspace:<workspaceId>` — inbox-list updates
- `agent:<agentId>` — direct DMs to one agent
- `conversation:<conversationId>` — joined on demand via the `conversation:join` event

All emit helpers (`emitWorkspace`, `emitConversation`, `emitAgent`) are called from services, not controllers. The event-name strings live in `common/constants/events.ts` — add new events there so frontend and backend stay in lockstep.

### Auth + RBAC

`JwtAuthGuard` is registered as a global `APP_GUARD` — every route requires a token unless decorated with `@Public()`. `@Public()` is used on `auth/login` and on the `webhooks/*` controller (which has its own signature verification).

Roles form a hierarchy (`common/constants/roles.enum.ts`): `owner > admin > supervisor > agent`. The `RolesGuard` checks `>=` against the minimum role declared in `@Roles(...)`. Agents are additionally scoped at the *query* level in `ConversationsService.list/get` — they can only see assigned-to-self or unassigned-open conversations.

### Frontend data flow

- `lib/auth-store.ts` — Zustand store, persisted to localStorage. Holds access/refresh tokens + session agent.
- `lib/api.ts` — axios instance, auto-attaches `Authorization`, unwraps `{success, data}` envelope, redirects to `/login` on 401.
- `lib/socket.ts` — single shared Socket.IO client, token from auth-store.
- All API surface is typed in `services/index.ts` (one module per backend resource). Pages call services through React Query (`@tanstack/react-query`). Don't `fetch` directly from a page.

The `(dashboard)` route group has its own layout that gates on auth + boots the socket. Pages outside it (e.g., `/login`) must not assume a logged-in user.

### Response envelope

`ResponseInterceptor` wraps controller returns as `{ success: true, data }`. `AllExceptionsFilter` wraps errors as `{ success: false, error: { code, message, path } }`. The frontend axios interceptor unwraps `data` automatically, so service code sees the inner shape. Don't manually wrap in controllers — return raw objects.

### Raw body for webhooks

`main.ts` disables Nest's default body parser, then mounts `express.json()` with a `verify` callback that copies the buffer onto `req.rawBody`. The webhook controller uses `req.rawBody` (not `req.body`) for HMAC verification. **If you add middleware or switch body parsers, the signature check will silently start failing.**

## Files where the abstractions live

When you need to wire a new feature across the stack:

- DB shape → `backend/prisma/schema.prisma` (then `npx prisma migrate dev`)
- New backend module → register in `backend/src/app.module.ts`
- Realtime events → add to `backend/src/common/constants/events.ts`, emit from service via `RealtimeGateway`, subscribe in frontend hook/component
- New API endpoint → controller + service + DTO, then add to `frontend/src/services/index.ts` with typed signature
- New page → `frontend/src/app/(dashboard)/<name>/page.tsx`, link from `(dashboard)/layout.tsx` nav array
- Role gating → `@Roles(Role.X)` + `@UseGuards(RolesGuard)` on controller method; for agent-scoping inside data, do it at the Prisma `where` clause

## Project state

The codebase is scaffolded end-to-end (auth → channels → webhook ingestion → outbound → realtime → dashboard) but has **no tests yet** and **no migrations committed** — first run after schema changes needs `npx prisma migrate dev` to generate the SQL. Treat the seed user (`owner@hengchat.local / ChangeMe!2026`) as dev-only; rotate it on any non-local deployment.
