# Slack Kudos MVP

Production-ready MVP for internal Slack kudos:

- Employees get a fixed monthly giving balance (default `100`).
- Giving kudos deducts only from the giver's monthly balance.
- Receiving kudos does **not** increase giving power.
- Immutable audit trail in PostgreSQL.
- Slack slash commands + Next.js analytics dashboard.

## Project Structure

- `server/` - Node.js + Express + Prisma + Slack command handling
- `dashboard/` - Next.js internal dashboard (leaderboard, user stats, audit log)

## One-click Docker run

```bash
cp .env.docker.example .env
docker compose up --build
```

Services:

- Dashboard: `http://localhost:3000`
- API server: `http://localhost:4000`
- Postgres: `localhost:5432`

Notes:

- `migrate` service runs `prisma migrate deploy` before API startup.
- Set real `SLACK_SIGNING_SECRET` and `SLACK_BOT_TOKEN` in root `.env`.
- Stop stack with `docker compose down` (add `-v` to remove DB volume).

### Nginx (single hostname for UI + API)

Compose includes **`nginx`** as a reverse proxy for **`kudos.piyusharyan.xyz`**:

- `http://kudos.piyusharyan.xyz/` → dashboard
- `http://kudos.piyusharyan.xyz/slack/commands` → API (use HTTPS in production; see `nginx/README.md`)
- `http://kudos.piyusharyan.xyz/api/...` → API
- `http://kudos.piyusharyan.xyz/health` → API health

Point DNS **A record** `kudos.piyusharyan.xyz` at your server. For **free** trusted TLS, use **Let’s Encrypt** — see [`certbot/README.md`](certbot/README.md). For nginx routing details, see [`nginx/README.md`](nginx/README.md).

The dashboard container still calls the API internally at `http://server:4000` (no need to change `DASHBOARD_API_BASE_URL` for Docker).

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+
- Slack workspace with permissions to create slash commands

## 1) Backend Setup

```bash
cd server
cp .env.example .env
```

Required env vars in `server/.env`:

- `DATABASE_URL`
- `SLACK_SIGNING_SECRET`
- `SLACK_BOT_TOKEN`
- `INTERNAL_API_TOKEN` (used by dashboard internal API calls)

Optional controls:

- `DEFAULT_MONTHLY_BALANCE` (default `100`)
- `MAX_KUDOS_PER_TRANSACTION` (default `50`)
- `ENABLE_DAILY_RECEIVER_CAP` + `DAILY_RECEIVER_CAP`
- `CRON_MONTHLY_RESET` (default `0 2 1 * *` UTC)
- `ENABLE_MANUAL_MONTHLY_RESET` (default `false`)

Install and prepare DB:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Run backend:

```bash
npm run dev
```

Backend base URL defaults to `http://localhost:4000`.

## 2) Dashboard Setup

```bash
cd dashboard
cp .env.example .env.local
npm install
npm run dev
```

Required env vars in `dashboard/.env.local`:

- `DASHBOARD_API_BASE_URL` (example `http://localhost:4000`)
- `INTERNAL_API_TOKEN` (same value as backend)

Dashboard pages:

- `/leaderboard`
- `/users/:slackUserId`
- `/audit-log`

## 3) Slack App Setup

Create an internal Slack app and configure:

1. **Slash commands**
   - `/kudos`
   - `/kudos-balance`
   - `/kudos-leaderboard`
   - `/kudos-stats`
2. **Request URL** for each command:
   - `https://<your-domain>/slack/commands`
3. **OAuth scopes** (Bot token):
   - `commands` (slash commands)
   - `users:read` (display names and `users.list` for @handle resolution)
   - `conversations:read` (verify `/kudos` runs in a channel, not a DM; read channel name for audit log)
4. Install app to workspace and copy:
   - Bot token -> `SLACK_BOT_TOKEN`
   - Signing secret -> `SLACK_SIGNING_SECRET`

## Slash Command Behavior

### Debugging Slack commands

The API logs Slack traffic with `subsystem: "slack"` (search logs for `slack_command_inbound`, `slack_command_response`, `slack_signature_rejected`, `kudos_command_parsed`, `slack_command_error`).

- Set `SLACK_VERBOSE_LOGGING=true` (default) for full JSON responses, redacted raw body preview, and per-character code points for the `text` field (helps spot invisible characters).
- Set `SLACK_VERBOSE_LOGGING=false` to shorten logs while keeping structured request/response objects.
- Secrets in the form body (`token`, `response_url`, `trigger_id`) are always redacted in logs.

### `/kudos @user points message`

`/kudos` works only in **public or private channels**. It is **blocked in DMs and group DMs** (Slack `D…` conversations and `is_im` / `is_mpim` from `conversations.info`). Other commands (`/kudos-balance`, etc.) still work from anywhere.

Each stored kudos row records **channel id and channel name** for the dashboard audit log.

Example:

```text
/kudos @rahul 10 great debugging help today
```

Flow:

1. Validate command syntax and points.
2. Block self-kudos and invalid values.
3. Ensure giver has enough monthly remaining points.
4. Deduct giver's balance.
5. Insert immutable record in `kudos_transactions`.
6. Return Slack confirmation message.

### `/kudos-balance`

Shows caller's remaining monthly giving balance.

### `/kudos-leaderboard`

Shows top givers and top receivers.

### `/kudos-stats`

Shows caller totals: given vs received + current remaining balance.

## Monthly Reset

- Scheduler runs via cron expression (`CRON_MONTHLY_RESET`) and provisions current-month balances.
- New rows use each user’s **effective** quota: their **category’s** `monthly_giving_quota` if set, otherwise `DEFAULT_MONTHLY_BALANCE`.
- Idempotent upserts use `update: {}` so the cron job does **not** refill balances mid-month.
- Optional guarded manual endpoint:
  - `POST /admin/monthly-reset`
  - Requires `Authorization: Bearer <INTERNAL_API_TOKEN>`
  - Works only if `ENABLE_MANUAL_MONTHLY_RESET=true`.

## User categories & admin UI

- Table **`user_categories`**: `key` (unique, e.g. `employee`), `name`, optional `monthly_giving_quota` (null = use `DEFAULT_MONTHLY_BALANCE`).
- Migration seeds **`employee`**; new Slack users are linked to that category automatically.
- Dashboard (same auth as the API — `INTERNAL_API_TOKEN` on server actions):
  - **[Admin · Categories](/admin/categories)** — create/edit/delete categories (delete only when no users use the category; `employee` cannot be deleted).
  - **[Admin · Quotas](/admin/quotas)** — assign a category to one user or many; reset one user’s **current month** balance; **reset all** (two browser confirmations).

## API Endpoints (for dashboard/internal use)

- `GET /health`
- `GET /api/leaderboard`
- `GET /api/users/:slackUserId/stats` (includes `userCategory`, `effectiveMonthlyQuota`, `workspaceDefaultMonthlyBalance`)
- `GET /api/audit-log?page=1&pageSize=25`
- `POST /admin/monthly-reset` (guarded by `ENABLE_MANUAL_MONTHLY_RESET`)
- `GET /admin/user-categories` — list categories (includes `userCount`)
- `POST /admin/user-categories` — body `{ "key": "manager", "name": "Manager", "monthlyQuota": 500 | null }`
- `PATCH /admin/user-categories/:id` — body `{ "name"?, "monthlyQuota": number | null }`
- `DELETE /admin/user-categories/:id` — only if empty and not `employee`
- `GET /admin/users?page=1&limit=50&search=` — list users with category and current-month remaining
- `PATCH /admin/users/:slackUserId/category` — body `{ "userCategoryId": "<cuid>" }`
- `POST /admin/users/:slackUserId/reset-balance` — refill current month to effective quota
- `POST /admin/users/bulk-category` — body `{ "slackUserIds": ["U…"], "userCategoryId": "<cuid>" }`
- `POST /admin/balances/reset-all` — reset **all** users’ current-month balances to effective quota

All `/admin/*` routes require `Authorization: Bearer <INTERNAL_API_TOKEN>` (same token as `/api/*`).

## Testing and Validation

Backend:

```bash
cd server
npm run lint
npm run test
npm run build
```

Dashboard:

```bash
cd dashboard
npm run lint
npm run build
```

## Deployment Notes

- Deploy `server` behind HTTPS for Slack signature security.
- Run Prisma migrations before starting app in production.
- Ensure server clock is correct (Slack signature replay protection checks timestamp).
- Lock down internal APIs via network and `INTERNAL_API_TOKEN`.
- Keep `kudos_transactions` immutable for audit integrity.
