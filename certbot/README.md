# Free HTTPS with Let’s Encrypt (Certbot)

**Let’s Encrypt** issues **free** TLS certificates that browsers and Slack trust.

**OpenSSL** can also create certificates for free, but **self-signed** ones are **not** trusted by Slack or users’ browsers unless you install a custom CA everywhere—avoid that for this app.

## One-time setup

1. **DNS**: `kudos.piyusharyan.xyz` A record → your server’s public IP.

2. **Start the stack** so nginx serves port **80** (with the ACME path in `nginx/conf.d/default.conf`):

   ```bash
   docker compose up -d nginx
   ```

3. **Issue the certificate** (replace email; uses the shared `certbot/www` webroot):

   ```bash
   mkdir -p certbot/www certbot/conf

   docker run --rm \
     -v "$(pwd)/certbot/www:/var/www/certbot" \
     -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
     certbot/certbot certonly --webroot \
     -w /var/www/certbot \
     -d kudos.piyusharyan.xyz \
     --email you@yourdomain.com \
     --agree-tos \
     --non-interactive
   ```

4. **Enable HTTPS in nginx** — use the Let’s Encrypt example config (see `nginx/conf.d/default-ssl-letsencrypt.conf.example`), then recreate nginx:

   ```bash
   cp nginx/conf.d/default-ssl-letsencrypt.conf.example nginx/conf.d/default.conf
   docker compose up -d --force-recreate nginx
   ```

5. **Slack**: set slash command URL to  
   `https://kudos.piyusharyan.xyz/slack/commands`

## Renewal

Certificates expire about every 90 days. Renew with:

```bash
docker run --rm \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  certbot/certbot renew --webroot -w /var/www/certbot
```

Then reload nginx:

```bash
docker compose exec nginx nginx -s reload
```

Put the `renew` command on a **cron** job (e.g. twice a month).
