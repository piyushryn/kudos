# Nginx reverse proxy

`conf.d/default.conf` routes **`kudos.piyusharyan.xyz`** (and `localhost` for quick checks):

| Path | Service |
|------|---------|
| `/.well-known/acme-challenge/*` | Let’s Encrypt HTTP-01 (Certbot) |
| `/slack/*` | Express API (`server:4000`) |
| `/health` | Express API |
| `/api/*` | Express API |
| `/`, `/admin/*`, `/leaderboard`, `/users/*`, `/_next/*` | Next.js dashboard (`dashboard:3000`) |

Express also exposes JSON under `/admin/*` (Bearer `INTERNAL_API_TOKEN`), but that is **not** proxied on the public hostname: it would collide with the Next.js admin UI. The dashboard container calls it only via **`DASHBOARD_API_BASE_URL`** (e.g. `http://server:4000` on the Docker network). To hit those endpoints from your laptop, use the API port directly or a separate host/subdomain—not `https://your-domain/admin/...` on nginx.

## DNS

Point an **A record** for `kudos.piyusharyan.xyz` to your server’s public IP.

## Free HTTPS (recommended for Slack)

**Let’s Encrypt** gives **free** certificates that Slack and browsers trust.

- **Not** the same as a self-signed **OpenSSL** cert: those are “free” too, but **not trusted** by Slack unless you add a private CA everywhere.

Step-by-step (Certbot + this nginx layout): **[`../certbot/README.md`](../certbot/README.md)**.

After certificates exist, use **`nginx/conf.d/default-ssl-letsencrypt.conf.example`** as `default.conf` (see that README).

Slack slash command URL:

`https://kudos.piyusharyan.xyz/slack/commands`

## Manual TLS files (commercial CA or your own PEMs)

Copy `fullchain.pem` and `privkey.pem` into `nginx/ssl/` and use **`nginx/conf.d/default-ssl.conf.example`** as `default.conf` (paths `/etc/nginx/ssl/` inside the container).

## HTTP-only (port 80)

Compose publishes **80** and **443** on nginx. With the default HTTP-only `default.conf`, **HTTPS** on 443 will not answer until you switch to an SSL config and have real certs.

## Cloudflare: error 521 on `https://` while `http://` works

**521** means Cloudflare could not open a TCP connection to your **origin** the way your SSL mode requires (usually **port 443**).

1. **Open port 443** on the host firewall / cloud security group (inbound TCP 443).
2. **Serve TLS on nginx**: copy `default-ssl-letsencrypt.conf.example` → `default.conf`, ensure Let’s Encrypt certs exist and compose mounts `certbot/conf` (see [`../certbot/README.md`](../certbot/README.md)), then `docker compose up -d --force-recreate nginx`.
3. **Cloudflare SSL/TLS** → **Overview**: if set to **Full** or **Full (strict)**, the origin **must** listen on **443** with a certificate. **Flexible** uses HTTP to the origin on **80** only (no origin HTTPS required—but prefer Full + real certs).
4. **Verify on the server**: `curl -vkI https://127.0.0.1` (with `Host: kudos.piyusharyan.xyz` if needed) or check `docker compose logs nginx` for SSL errors.

Temporarily set the DNS record to **DNS only** (grey cloud) to confirm the origin serves HTTPS without Cloudflare in the middle.
