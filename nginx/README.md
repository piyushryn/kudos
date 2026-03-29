# Nginx reverse proxy

`conf.d/default.conf` routes **`kudos.piyusharyan.xyz`** (and `localhost` for quick checks):

| Path | Service |
|------|---------|
| `/.well-known/acme-challenge/*` | Let’s Encrypt HTTP-01 (Certbot) |
| `/slack/*` | Express API (`server:4000`) |
| `/health` | Express API |
| `/api/*` | Express API |
| `/admin/*` | Express API |
| `/` | Next.js dashboard (`dashboard:3000`) |

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
