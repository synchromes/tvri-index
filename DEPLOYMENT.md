# TVRI Index - EC2 Deployment Guide

## Prerequisites

- Ubuntu 20.04+ EC2 instance
- 2 CPU cores, 8GB RAM minimum
- Security Group: Allow ports 80, 443, 22

## Quick Deploy

### 1. SSH into your EC2 instance

```bash
ssh ubuntu@your-ec2-ip
```

### 2. Clone repository

```bash
git clone https://github.com/synchromes/tvri-index.git
cd tvri-index
```

### 3. Run deployment script

```bash
sudo bash deploy.sh
```

This will automatically:
- Install Node.js 20, Python 3.11, Nginx, PM2
- Clone repository
- Install all dependencies
- Build frontend for production
- Setup PM2 process manager
- Configure Nginx reverse proxy
- Start all services

### 4. Access your application

- Frontend: `http://tvri-index.bernacle.my.id`
- Backend API: `http://tvri-index.bernacle.my.id/api`

## Post-Deployment Configuration

### Configure Environment Variables

```bash
cd ~/tvri-index/frontend
cp .env.example .env.local
nano .env.local
```

Update `NEXT_PUBLIC_API_URL` with your domain or IP.

### Setup SSL (Optional)

If you have a domain:

```bash
cd ~/tvri-index
sudo bash setup-ssl.sh tvri-index.bernacle.my.id
```

### Configure AI API Keys

Open application in browser → Settings → Configure your AI provider:
- OpenAI API Key
- Google Gemini API Key
- OpenRouter API Key

## Management Commands

### View application logs

```bash
pm2 logs
```

### Restart applications

```bash
pm2 restart all
```

### Stop applications

```bash
pm2 stop all
```

### Update application

```bash
cd ~/tvri-index
git pull origin main
cd frontend && npm install && npm run build
cd ../backend && source venv/bin/activate && pip install -r requirements.txt
pm2 restart all
```

## Troubleshooting

### Check service status

```bash
pm2 status
sudo systemctl status nginx
```

### Check logs

```bash
pm2 logs tvri-frontend
pm2 logs tvri-backend
sudo tail -f /var/log/nginx/error.log
```

### Restart services

```bash
pm2 restart all
sudo systemctl restart nginx
```

## Security Recommendations

1. **Setup Firewall**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **Setup SSL** (see above)

3. **Regular Updates**
```bash
sudo apt update && sudo apt upgrade -y
```

## Architecture

```
EC2 Instance
├── Nginx (Port 80/443) → Reverse Proxy
│   ├── / → Frontend (Port 3000)
│   └── /api → Backend (Port 8000)
├── PM2 → Process Manager
│   ├── tvri-frontend (Next.js)
│   └── tvri-backend (FastAPI)
└── Data Storage
    └── JSON files in data/
```

## Support

For issues, check:
- Application logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -xe`
