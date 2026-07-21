#!/bin/bash
set -e

# =============================================================================
# Reframe Deploy Script
#
# Manual VDS setup required before first deploy:
#
#   nginx (/etc/nginx/sites-available/reframe):
#   ```
#   server {
#       listen 80;
#       server_name _;  # IP-based for MVP
#
#       root /var/www/reframe/dist;
#       index index.html;
#
#       # SPA fallback
#       location / {
#           try_files $uri $uri/ /index.html;
#       }
#
#       # API proxy
#       location /api/ {
#           proxy_pass http://localhost:3000;
#           proxy_http_version 1.1;
#           proxy_set_header Upgrade $http_upgrade;
#           proxy_set_header Connection 'upgrade';
#           proxy_set_header Host $host;
#           proxy_cache_bypass $http_upgrade;
#           proxy_read_timeout 15s;
#       }
#   }
#   ```
#   Enable: ln -s /etc/nginx/sites-available/reframe /etc/nginx/sites-enabled/
#   Reload: sudo systemctl reload nginx
#
#   systemd (/etc/systemd/system/reframe-backend.service):
#   ```
#   [Unit]
#   Description=Reframe Backend
#   After=network.target
#
#   [Service]
#   Type=simple
#   User=reframe
#   WorkingDirectory=/opt/reframe
#   ExecStart=/usr/bin/java -jar /opt/reframe/reframe.jar
#   Restart=always
#   RestartSec=5
#   EnvironmentFile=/opt/reframe/config.env
#
#   [Install]
#   WantedBy=multi-user.target
#   ```
#   Enable: sudo systemctl enable reframe-backend
#
#   Directories (create once):
#     sudo mkdir -p /var/www/reframe/dist /opt/reframe
#     sudo chown -R reframe:reframe /var/www/reframe /opt/reframe
#
#   Environment (create once):
#     echo "LLM_API_KEY=your-key" > /opt/reframe/config.env
#
# =============================================================================

VDS_HOST="${VDS_HOST:?Set VDS_HOST env var}"
VDS_USER="${VDS_USER:-reframe}"

echo "🚀 Deploying Reframe..."

# Frontend
echo "📦 Building frontend..."
cd frontend && npm ci && npm run build
rsync -avz dist/ "$VDS_USER@$VDS_HOST:/var/www/reframe/dist/"

# Backend
echo "☕ Building backend..."
cd ../backend && lein uberjar
scp target/reframe.jar "$VDS_USER@$VDS_HOST:/opt/reframe/"

# Restart
echo "🔄 Restarting backend..."
ssh "$VDS_USER@$VDS_HOST" "sudo systemctl restart reframe-backend"

echo "✅ Deploy complete!"
