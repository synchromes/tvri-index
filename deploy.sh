#!/bin/bash

# TVRI Index - EC2 Ubuntu Deployment Script
# Run as: sudo bash deploy.sh

set -e  # Exit on error

echo "====================================="
echo "TVRI Index - Deployment Started"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo bash deploy.sh${NC}"
    exit 1
fi

# Get non-root user
REAL_USER=${SUDO_USER:-$USER}
USER_HOME=$(eval echo ~$REAL_USER)

echo -e "${GREEN}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}[2/10] Installing essential packages...${NC}"
apt install -y curl wget git build-essential software-properties-common

echo -e "${GREEN}[3/10] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v

echo -e "${GREEN}[4/10] Installing Python 3.11...${NC}"
apt install -y python3.11 python3.11-venv python3-pip
python3 --version

echo -e "${GREEN}[5/10] Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx

echo -e "${GREEN}[6/10] Installing PM2 globally...${NC}"
npm install -g pm2
pm2 startup systemd -u $REAL_USER --hp $USER_HOME

echo -e "${GREEN}[7/10] Cloning repository...${NC}"
DEPLOY_DIR="$USER_HOME/tvri-index"
if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}Directory exists. Pulling latest changes...${NC}"
    cd $DEPLOY_DIR
    sudo -u $REAL_USER git pull origin main
else
    sudo -u $REAL_USER git clone https://github.com/synchromes/tvri-index.git $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

echo -e "${GREEN}[8/10] Installing Frontend dependencies...${NC}"
cd $DEPLOY_DIR/frontend
sudo -u $REAL_USER npm install

echo -e "${YELLOW}Building Next.js production...${NC}"
sudo -u $REAL_USER npm run build

echo -e "${GREEN}[9/10] Installing Backend dependencies...${NC}"
cd $DEPLOY_DIR/backend
sudo -u $REAL_USER python3 -m venv venv
sudo -u $REAL_USER bash -c "source venv/bin/activate && pip install -r requirements.txt"

echo -e "${GREEN}[10/10] Setting up services...${NC}"

# Copy PM2 ecosystem file
cat > $DEPLOY_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'tvri-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M'
    },
    {
      name: 'tvri-backend',
      cwd: './backend',
      script: 'venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      env: {
        PYTHONPATH: '.'
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M'
    }
  ]
}
EOF

chown $REAL_USER:$REAL_USER $DEPLOY_DIR/ecosystem.config.js

# Setup Nginx configuration
cat > /etc/nginx/sites-available/tvri-index << 'EOF'
server {
    listen 80;
    server_name tvri-index.bernacle.my.id;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Increase timeout for AI analysis
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/tvri-index /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo -e "${GREEN}Starting applications with PM2...${NC}"
cd $DEPLOY_DIR
sudo -u $REAL_USER pm2 start ecosystem.config.js
sudo -u $REAL_USER pm2 save

echo ""
echo -e "${GREEN}====================================="
echo "Deployment Complete! ✅"
echo "=====================================${NC}"
echo ""
echo -e "Frontend: ${GREEN}http://tvri-index.bernacle.my.id${NC}"
echo -e "Backend:  ${GREEN}http://tvri-index.bernacle.my.id/api${NC}"
echo ""
echo -e "${YELLOW}Important Next Steps:${NC}"
echo "1. Configure environment variables:"
echo "   cd $DEPLOY_DIR/frontend"
echo "   nano .env.local"
echo ""
echo "2. Configure AI API Keys in app Settings modal"
echo ""
echo "3. (Optional) Setup SSL with Certbot:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d tvri-index.bernacle.my.id"
echo ""
echo "4. View logs:"
echo "   sudo -u $REAL_USER pm2 logs"
echo ""
echo "5. Restart services:"
echo "   sudo -u $REAL_USER pm2 restart all"
echo ""
echo -e "${GREEN}Deployment script created by TVRI Index Team${NC}"
