#!/usr/bin/env bash
# Opens UFW for the demo port and adds a temporary nginx reverse proxy on a high port
# that may already be allowed — prefer allowing 3020 directly.
set -euo pipefail
PORT="${1:-3020}"

if [[ $EUID -ne 0 ]]; then
  echo "Run with: sudo bash $0 $PORT"
  exit 1
fi

ufw allow "${PORT}/tcp" comment 'innoscripta news aggregator demo'
ufw status | grep -E "${PORT}|Status" || true

# Also proxy via nginx on port 18090 if that helps (optional)
CONF=/etc/nginx/sites-available/innoscripta-demo
cat > "$CONF" <<NGINX
server {
    listen 18090;
    listen [::]:18090;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
ln -sfn "$CONF" /etc/nginx/sites-enabled/innoscripta-demo
ufw allow 18090/tcp comment 'innoscripta nginx demo proxy' || true
nginx -t
systemctl reload nginx
echo "Opened TCP ${PORT} and nginx proxy on 18090 -> 127.0.0.1:${PORT}"
echo "Try: http://$(hostname -I | awk '{print $1}'):${PORT}"
echo "Or:  http://$(hostname -I | awk '{print $1}'):18090"
