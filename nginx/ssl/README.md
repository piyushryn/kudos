# Manual TLS files (optional)

If you are **not** using Let’s Encrypt via `certbot/`, you can place your own `fullchain.pem` and `privkey.pem` here and use `nginx/conf.d/default-ssl.conf.example` (paths `/etc/nginx/ssl/...` inside the container).

For **free, trusted** certificates, prefer **Let’s Encrypt** and follow [`../../certbot/README.md`](../../certbot/README.md).
