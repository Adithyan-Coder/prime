# PRIME - Deployment Guide

Complete guide for deploying the PRIME application to production.

## Overview

This application consists of:
- **Frontend**: React app with TypeScript (Vite)
- **Backend**: Django REST API
- **Database**: Supabase (PostgreSQL)

## Local Development

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Quick Start

```bash
# 1. Clone/extract the project
cd PRIME_CODE

# 2. Setup backend
cd prime_backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Run backend
python manage.py runserver

# 3. In a new terminal, setup frontend
cd backupprime
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Run frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Deployment Strategies

### Option 1: Render + Vercel (Recommended for Beginners)

#### Backend Deployment (Render)

1. **Prepare backend for deployment:**
   ```bash
   cd prime_backend
   # Add gunicorn to requirements.txt
   echo "gunicorn==21.2.0" >> requirements.txt
   ```

2. **Create Render account:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub account

3. **Create Web Service:**
   - Click "New+" → "Web Service"
   - Connect your GitHub repo (or upload manually)
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`

4. **Environment Variables in Render:**
   - Add `SUPABASE_URL`
   - Add `SUPABASE_KEY`
   - Add `SUPABASE_JWT_SECRET`
   - Set `DEBUG=False`
   - Generate a new `SECRET_KEY`

5. **Deploy:**
   - Render will auto-deploy on git push
   - Note the URL (e.g., `https://prime-backend.onrender.com`)

#### Frontend Deployment (Vercel)

1. **Create Vercel account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy frontend:**
   - Click "New Project"
   - Select your GitHub repo (backupprime folder)
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Environment Variables in Vercel:**
   - Add `VITE_API_URL=https://your-render-backend-url/api`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Option 2: Heroku (Traditional Deployment)

#### Backend to Heroku

```bash
# Install Heroku CLI
# Go to heroku.com and create account

# Login
heroku login

# Create app
heroku create prime-backend

# Add buildpacks
heroku buildpacks:add heroku/python

# Set environment variables
heroku config:set SUPABASE_URL=https://...
heroku config:set SUPABASE_KEY=...
heroku config:set SUPABASE_JWT_SECRET=...
heroku config:set SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')
heroku config:set DEBUG=False

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Frontend to Heroku

```bash
# In backupprime folder
heroku create prime-frontend

# Add buildpack
heroku buildpacks:add heroku/nodejs

# Build configuration (create Procfile)
echo "web: npm run build && npm start" > Procfile

# Set env var
heroku config:set VITE_API_URL=https://prime-backend.herokuapp.com/api

# Deploy
git push heroku main
```

### Option 3: AWS Deployment

#### Backend on EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install dependencies
sudo yum update -y
sudo yum install python3 pip -y
sudo yum install nginx -y

# Clone repository
git clone <your-repo-url>
cd prime_backend

# Setup virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Create .env file
nano .env
# Add your Supabase credentials

# Run with gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:8000

# Configure nginx as reverse proxy
sudo nano /etc/nginx/nginx.conf
# Add config to proxy requests to gunicorn
```

#### Frontend on S3 + CloudFront

```bash
# Build frontend
cd backupprime
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name/

# Setup CloudFront distribution for the S3 bucket
# Configure CORS on S3 bucket
```

### Option 4: Docker Deployment

```bash
# Build Docker images
docker-compose build

# Run containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

#### Push to Docker Hub

```bash
# Build image
docker build -t username/prime-backend:latest prime_backend/

# Push to Docker Hub
docker push username/prime-backend:latest

# Deploy on any Docker-compatible platform
# (AWS ECS, Google Cloud Run, DigitalOcean, etc.)
```

## Production Checklist

### Backend

- [ ] Change `DEBUG=False`
- [ ] Generate new `SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Update `CORS_ALLOWED_ORIGINS` with frontend URL
- [ ] Use production database (Supabase)
- [ ] Enable HTTPS
- [ ] Setup error logging (Sentry)
- [ ] Configure email service
- [ ] Setup backup strategy
- [ ] Monitor performance

### Frontend

- [ ] Build for production (`npm run build`)
- [ ] Update API URL to production backend
- [ ] Setup error tracking
- [ ] Enable analytics
- [ ] Optimize images and assets
- [ ] Setup CDN for static files
- [ ] Configure cache headers

### Database (Supabase)

- [ ] Enable SSL connections
- [ ] Setup automated backups
- [ ] Monitor database performance
- [ ] Set up usage alerts
- [ ] Configure row-level security (RLS)

## SSL Certificate

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Monitoring & Logging

### Application Monitoring
- **Sentry** (Error tracking)
- **New Relic** (Performance monitoring)
- **Datadog** (Infrastructure monitoring)

### Setup Sentry

```bash
# Install sentry SDK
pip install sentry-sdk

# In Django settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
)
```

## Scaling

### Database Scaling
- Supabase auto-scales, but monitor connections
- Consider connection pooling (PgBouncer)

### Backend Scaling
- Use horizontal scaling (multiple instances)
- Setup load balancer (Nginx, HAProxy)
- Use task queue (Celery) for async jobs

### Frontend Scaling
- Use CDN (CloudFront, Cloudflare)
- Enable compression (gzip, brotli)
- Optimize bundle size

## Backup & Recovery

### Supabase Backups
```bash
# Automatic daily backups included
# Go to Supabase dashboard → Backups
# Or setup pg_dump for manual backup

pg_dump postgresql://user:password@db.supabase.co/postgres > backup.sql
```

### Code Backups
```bash
# Push to GitHub regularly
git push origin main

# GitHub includes version control history
```

## Troubleshooting

### Backend not connecting to frontend
1. Check CORS settings in Django
2. Verify API URL in frontend .env
3. Check network/firewall rules

### Database connection timeout
1. Verify Supabase credentials
2. Check database status in Supabase dashboard
3. Review database connection logs

### Slow performance
1. Enable Django debug toolbar locally
2. Use Supabase query performance insights
3. Implement caching
4. Optimize database queries

## Cost Estimation

- **Supabase**: $0-100+/month (Pay per use)
- **Render/Heroku**: $7-50+/month per service
- **Vercel**: $0-50+/month (Free tier available)
- **AWS**: Varies ($5-100+/month)
- **Domain**: $10-15/year

## Support

For deployment help:
- Check logs: `docker-compose logs`
- Review Django error pages
- Check Supabase documentation
- Use platform-specific support (Render, Vercel, etc.)

## Quick Deploy Commands

```bash
# Render deployment
git push origin main  # Auto-deploys

# Heroku deployment
git push heroku main

# Vercel deployment
# Connected to GitHub, auto-deploys on push

# Manual deployment
# Build: npm run build (frontend), pip install (backend)
# Run: npm start (frontend), python manage.py runserver (backend)
```

For questions, refer to deployment platform docs or contact support.
