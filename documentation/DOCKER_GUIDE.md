# Docker Deployment Guide

## Overview

Complete Docker setup for the Headless Content Delivery system, including:
- **MySQL 8.0** - Database
- **Redis 7** - Message broker and cache
- **FastAPI** - Backend API
- **Celery** - Async task worker
- **React Frontend** - User interface (nginx)

---

## Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

This will start:
- MySQL on port 3306
- Redis on port 6379
- API on port 8000
- Frontend on port 3000

### 2. Check Service Status

```bash
docker-compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
campaigns_mysql         Up (healthy)        0.0.0.0:3306->3306/tcp
campaigns_redis         Up (healthy)        0.0.0.0:6379->6379/tcp
campaigns_api           Up                  0.0.0.0:8000->8000/tcp
campaigns_celery        Up                  
campaigns_frontend      Up (healthy)        0.0.0.0:3000->80/tcp
```

### 3. Access Applications

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Login

- Username: `admin`
- Password: `changeme`

---

## Docker Compose Services

### MySQL Database

```yaml
mysql:
  image: mysql:8.0
  ports: "3306:3306"
  environment:
    MYSQL_ROOT_PASSWORD: rootpassword
    MYSQL_DATABASE: campaigns_db
    MYSQL_USER: campaign_user
    MYSQL_PASSWORD: campaignpass
```

**Features:**
- Auto-initialization with `sql/setup_mysql.sql`
- Persistent volume for data
- Health checks
- UTF-8 character set

### Redis

```yaml
redis:
  image: redis:7-alpine
  ports: "6379:6379"
```

**Features:**
- Message broker for Celery
- Result backend
- Health checks

### Backend API

```yaml
api:
  build: .
  ports: "8000:8000"
  command: uvicorn api.main:app --host 0.0.0.0 --port 8000
```

**Features:**
- FastAPI application
- Auto-reload in development
- Health check endpoint
- Shared storage volume

### Celery Worker

```yaml
celery:
  build: .
  command: celery -A services.celery_app worker
```

**Features:**
- Async task processing
- Image generation
- Campaign processing
- 2 concurrent workers

### Frontend (React + nginx)

```yaml
frontend:
  build: ./front-end
  ports: "3000:80"
```

**Features:**
- React application built with Vite
- Served by nginx
- API proxy configured
- Gzip compression
- Static asset caching
- Production optimized

---

## Docker Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d frontend

# Start with logs
docker-compose up
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop frontend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f celery

# Last 100 lines
docker-compose logs --tail=100 api
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
docker-compose restart frontend
```

### Rebuild Images

```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build frontend
docker-compose build api

# Rebuild without cache
docker-compose build --no-cache frontend
```

### Execute Commands

```bash
# API container
docker-compose exec api bash
docker-compose exec api python -c "from api.database import init_db; init_db()"

# MySQL
docker-compose exec mysql mysql -u campaign_user -p campaigns_db

# Frontend
docker-compose exec frontend sh
```

---

## Multi-Stage Frontend Build

The frontend uses a multi-stage Docker build for optimization:

### Stage 1: Builder
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
```

**Purpose:**
- Install dependencies
- Build React application
- Create optimized production bundle

### Stage 2: Production
```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Purpose:**
- Lightweight nginx image
- Copy built files only
- Custom nginx configuration
- Small final image (~50MB)

---

## nginx Configuration

The frontend nginx config includes:

### API Proxy

```nginx
location /api/ {
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://api:8000;
}
```

Routes `/api/*` requests to the backend API.

### Static File Serving

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Enables React Router (SPA routing).

### Caching

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

Aggressive caching for static assets.

### Compression

```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/javascript;
```

Reduces transfer size by ~70%.

---

## Environment Variables

### API Service

```bash
DATABASE_URL=mysql+pymysql://campaign_user:campaignpass@mysql:3306/campaigns_db
REDIS_URL=redis://redis:6379/0
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=changeme
STORAGE_PATH=/app/storage
```

### Frontend Service

```bash
NODE_ENV=production
```

---

## Volumes

### MySQL Data

```yaml
volumes:
  mysql_data:
    driver: local
```

Persists database data across container restarts.

### Storage

```yaml
volumes:
  - ./storage:/app/storage
```

Shared between API and Celery for images.

---

## Health Checks

### MySQL

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  timeout: 20s
  retries: 10
```

### Redis

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  timeout: 3s
```

### Frontend

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
  interval: 30s
  timeout: 10s
```

---

## Production Deployment

### 1. Update Configuration

Edit `docker-compose.yml`:

```yaml
api:
  command: uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
  # Remove --reload flag

celery:
  command: celery -A services.celery_app worker --loglevel=warning --concurrency=4
```

### 2. Secure Credentials

Create `.env` file:

```bash
MYSQL_ROOT_PASSWORD=strong_random_password
MYSQL_PASSWORD=strong_campaign_password
BASIC_AUTH_PASSWORD=strong_auth_password
REDIS_URL=redis://:your_redis_password@redis:6379/0
```

Update `docker-compose.yml` to use `.env`:

```yaml
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
  BASIC_AUTH_PASSWORD: ${BASIC_AUTH_PASSWORD}
```

### 3. Add nginx Reverse Proxy

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
```

### 4. SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://frontend:80;
    }
}
```

### 5. Deploy

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Scaling

### Scale Celery Workers

```bash
docker-compose up -d --scale celery=4
```

Runs 4 Celery worker containers.

### Scale API

```bash
docker-compose up -d --scale api=3
```

Add load balancer (nginx) in front:

```nginx
upstream api_backend {
    server api_1:8000;
    server api_2:8000;
    server api_3:8000;
}
```

---

## Monitoring

### Container Stats

```bash
docker stats
```

Shows CPU, memory, network usage.

### Docker Logs

```bash
# Follow all logs
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 1000 lines
docker-compose logs --tail=1000
```

### Health Status

```bash
docker-compose ps
```

Check "STATUS" column for health.

---

## Troubleshooting

### Frontend Not Loading

**Check logs:**
```bash
docker-compose logs frontend
```

**Rebuild:**
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**Verify API connection:**
```bash
docker-compose exec frontend wget -O- http://api:8000/health
```

### API Connection Issues

**Check if API is running:**
```bash
docker-compose ps api
docker-compose logs api
```

**Test from frontend container:**
```bash
docker-compose exec frontend wget -O- http://api:8000/health
```

**Check network:**
```bash
docker network ls
docker network inspect headless-content-delivery_default
```

### Database Issues

**Check MySQL logs:**
```bash
docker-compose logs mysql
```

**Connect to MySQL:**
```bash
docker-compose exec mysql mysql -u campaign_user -p campaigns_db
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up -d
```

### Celery Not Processing

**Check logs:**
```bash
docker-compose logs celery
```

**Verify Redis connection:**
```bash
docker-compose exec celery python -c "from config import get_settings; print(get_settings().redis_url)"
```

**Restart worker:**
```bash
docker-compose restart celery
```

### Port Conflicts

If ports are already in use:

```yaml
ports:
  - "8001:8000"  # API on different port
  - "3001:80"    # Frontend on different port
```

---

## Backup & Restore

### Backup Database

```bash
docker-compose exec mysql mysqldump -u campaign_user -p campaigns_db > backup.sql
```

### Restore Database

```bash
docker-compose exec -T mysql mysql -u campaign_user -p campaigns_db < backup.sql
```

### Backup Volumes

```bash
docker run --rm -v headless-content-delivery_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_data_backup.tar.gz -C /data .
```

---

## Development vs Production

### Development

```yaml
api:
  command: uvicorn api.main:app --host 0.0.0.0 --reload
  volumes:
    - .:/app  # Mount source code
```

**Features:**
- Auto-reload on code changes
- Source code mounted
- Debug mode enabled
- Detailed error messages

### Production

```yaml
api:
  command: uvicorn api.main:app --host 0.0.0.0 --workers 4
  # No source code mount
```

**Features:**
- Multiple workers
- No auto-reload
- Optimized performance
- Production logging

---

## Docker Image Sizes

Approximate sizes:

- **mysql:8.0**: ~500MB
- **redis:7-alpine**: ~30MB
- **campaigns_api**: ~200MB
- **campaigns_celery**: ~200MB
- **campaigns_frontend**: ~50MB (nginx + built React)

**Total**: ~980MB

---

## Performance Tuning

### nginx Workers

```nginx
worker_processes auto;
worker_connections 1024;
```

### API Workers

```bash
--workers 4  # = (2 x CPU cores) + 1
```

### Celery Concurrency

```bash
--concurrency=4  # = CPU cores
```

### MySQL Optimization

```yaml
environment:
  MYSQL_INNODB_BUFFER_POOL_SIZE: 512M
  MYSQL_MAX_CONNECTIONS: 200
```

---

## Security Best Practices

1. **Change Default Passwords**
   ```yaml
   MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
   BASIC_AUTH_PASSWORD: ${BASIC_AUTH_PASSWORD}
   ```

2. **Use Secrets**
   ```yaml
   secrets:
     mysql_password:
       external: true
   ```

3. **Limit Network Exposure**
   ```yaml
   ports: []  # Don't expose MySQL externally
   ```

4. **Use SSL**
   - Configure nginx with SSL certificates
   - Use Let's Encrypt for free SSL

5. **Regular Updates**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## Quick Reference

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart frontend

# Rebuild and restart
docker-compose up -d --build frontend

# Stop everything
docker-compose down

# Clean everything (including volumes)
docker-compose down -v

# Check status
docker-compose ps

# View resource usage
docker stats
```

---

## Summary

✅ **Complete Docker stack**  
✅ **Multi-stage frontend build**  
✅ **nginx reverse proxy**  
✅ **Health checks**  
✅ **Production ready**  
✅ **Easy scaling**  
✅ **Comprehensive logging**  

---

**Last Updated:** October 10, 2025  
**Version:** 2.0.0  
**Status:** 🚀 Production Ready

