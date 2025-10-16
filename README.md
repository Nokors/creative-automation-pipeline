# Marketing Campaign API

A comprehensive REST API for creating and managing marketing campaigns with async image processing, AI-powered image generation, and multiple aspect ratio support.

## 🏗️ Architecture

- **[Architecture Diagram](ARCHITECTURE_DIAGRAM.md)** - Comprehensive system architecture with Mermaid diagrams
- **[Quick Architecture Reference](QUICK_ARCHITECTURE.md)** - One-page system overview

## 🚀 Features

- **Async Campaign Processing**: Queue-based async processing using Celery and Redis
- **Multiple Image Sources**:
  - Local file system
  - Dropbox shared links
  - AI-generated images via Adobe Firefly
- **Automatic Image Variations**: Creates three aspect ratios for each campaign:
  - 1:1 (Square - for social media posts)
  - 9:16 (Vertical - for stories/reels)
  - 16:9 (Horizontal - for banners/YouTube)
- **MySQL Storage**: Persistent campaign data storage with MySQL
- **Basic Authentication**: Secure endpoints with HTTP Basic Auth
- **Input Validation**: Comprehensive request validation using Pydantic
- **Content Validation**: Automatic prohibited words filtering for campaign content
- **RESTful Design**: Clean API design following REST principles

## 📋 Requirements

- Python 3.9+
- MySQL 8.0+
- Redis 6.0+
- Adobe Firefly API credentials (optional, for AI image generation)
- Dropbox API token (optional, for Dropbox integration)

## ✨ What's New

### Content Validation Service
Automatic validation of campaign content against prohibited words:
- ✅ Validates all text fields (description, message, products, target market)
- ✅ Case-insensitive matching with word boundaries
- ✅ Configurable prohibited words list
- ✅ Can be enabled/disabled via environment variables
- ✅ Detailed error messages showing which fields contain prohibited words

See [CONTENT_VALIDATION.md](CONTENT_VALIDATION.md) for details.

### Brand Color Validation
Automatic validation of campaign images for brand color compliance:
- ✅ Analyzes dominant colors in resized images
- ✅ Compares against configured brand color palette
- ✅ Calculates compliance percentage
- ✅ **Validates AFTER image resizing** to check actual delivered assets
- ✅ **Saves complete validation details** including color palettes and matches
- ✅ **Dedicated database columns** for fast queries and better performance
- ✅ Non-blocking warnings for brand consistency

See [BRAND_COLOR_VALIDATION.md](BRAND_COLOR_VALIDATION.md), [BRAND_VALIDATION_TIMING.md](BRAND_VALIDATION_TIMING.md), [BRAND_VALIDATION_DETAILS_STRUCTURE.md](BRAND_VALIDATION_DETAILS_STRUCTURE.md), and [BRAND_VALIDATION_SEPARATE_COLUMN.md](BRAND_VALIDATION_SEPARATE_COLUMN.md) for details.

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd headless-content-delivery
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Basic Auth
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=your_secure_password

# MySQL Configuration
DATABASE_URL=mysql+pymysql://campaign_user:your_secure_password@localhost:3306/campaigns_db

# Or use individual components:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=campaign_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=campaigns_db

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Adobe Firefly API (optional)
ADOBE_CLIENT_ID=your_client_id
ADOBE_CLIENT_SECRET=your_client_secret
ADOBE_API_KEY=your_api_key

# Dropbox API (optional)
DROPBOX_ACCESS_TOKEN=your_dropbox_token

# Storage
STORAGE_PATH=./storage
UPLOAD_PATH=./storage/uploads
GENERATED_PATH=./storage/generated

# Content Validation
PROHIBITED_WORDS_STR=spam,scam,fake,fraud,illegal,drugs,weapons
ENABLE_CONTENT_VALIDATION=true
```

### Quick Start via Docker

### 3. Start All Services

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
### 3. Check Service Status
Open page:

```
http://localhost:3000/
```

## 📚 API Endpoints

### Health Check

```bash
GET /
GET /health
```

### Create Campaign

```bash
POST /campaigns
```

**Authentication**: Basic Auth required

**Request Body**:

```json
{
  "description": "Summer 2025 Marketing Campaign",
  "target_market": "Young adults aged 18-35",
  "campaign_message": "Make this summer unforgettable!",
  "products_description": "Premium beach products and accessories",
  "image_metadata": {
    "source_type": "ai_generated",
    "ai_prompt": "A beautiful beach scene with colorful towels"
  },
  "generate_by_ai": true
}
```

**Image Source Types**:

1. **Local File**:
```json
{
  "source_type": "local",
  "source_path": "/path/to/image.jpg"
}
```

2. **Dropbox Link**:
```json
{
  "source_type": "dropbox",
  "source_path": "https://www.dropbox.com/s/xxxxx/image.jpg?dl=0"
}
```

3. **AI Generated**:
```json
{
  "source_type": "ai_generated",
  "ai_prompt": "A professional marketing image with products"
}
```

**Response** (202 Accepted):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Campaign creation initiated. Processing asynchronously."
}
```

### Get Campaign by ID

```bash
GET /campaigns/{campaign_id}
```

**Authentication**: Basic Auth required

**Response** (200 OK):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Summer 2025 Marketing Campaign",
  "target_market": "Young adults aged 18-35",
  "campaign_message": "Make this summer unforgettable!",
  "products_description": "Premium beach products",
  "image_metadata": {
    "source_type": "ai_generated",
    "ai_prompt": "A beautiful beach scene"
  },
  "generate_by_ai": "true",
  "processed_images": {
    "ratio_1_1": "storage/generated/550e8400/550e8400_1_1.jpg",
    "ratio_9_16": "storage/generated/550e8400/550e8400_9_16.jpg",
    "ratio_16_9": "storage/generated/550e8400/550e8400_16_9.jpg"
  },
  "status": "completed",
  "error_message": null,
  "created_at": "2025-10-10T12:00:00",
  "updated_at": "2025-10-10T12:05:30",
  "completed_at": "2025-10-10T12:05:30"
}
```

### List Campaigns

```bash
GET /campaigns?skip=0&limit=100&status_filter=completed
```

**Authentication**: Basic Auth required

**Query Parameters**:
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Max results (default: 100)
- `status_filter` (string): Filter by status (pending, processing, completed, failed, active)

## 🔐 Authentication

All endpoints (except health checks) require HTTP Basic Authentication:

```bash
# Using curl
curl -u admin:password http://localhost:8000/campaigns

# Using Python requests
import requests
from requests.auth import HTTPBasicAuth

response = requests.get(
    'http://localhost:8000/campaigns',
    auth=HTTPBasicAuth('admin', 'password')
)
```

## 🧪 Testing the API

### Using cURL

```bash
# Create a campaign with AI-generated image
curl -X POST http://localhost:8000/campaigns \
  -u admin:changeme \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test Campaign",
    "target_market": "Test Market",
    "campaign_message": "Test Message",
    "products_description": "Test Products",
    "image_metadata": {
      "source_type": "ai_generated",
      "ai_prompt": "A professional business meeting"
    },
    "generate_by_ai": true
  }'

# Get campaign status
curl -X GET http://localhost:8000/campaigns/{campaign_id} \
  -u admin:changeme

# List all campaigns
curl -X GET http://localhost:8000/campaigns \
  -u admin:changeme
```

### Using Python

```python
import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8000"
AUTH = HTTPBasicAuth("admin", "changeme")

# Create campaign
campaign_data = {
    "description": "Python Test Campaign",
    "target_market": "Developers",
    "campaign_message": "Learn Python with us!",
    "products_description": "Python courses and books",
    "image_metadata": {
        "source_type": "ai_generated",
        "ai_prompt": "Python programming concept illustration"
    },
    "generate_by_ai": True
}

response = requests.post(
    f"{BASE_URL}/campaigns",
    json=campaign_data,
    auth=AUTH
)

campaign = response.json()
campaign_id = campaign["id"]

print(f"Campaign created: {campaign_id}")

# Check campaign status
import time
time.sleep(5)  # Wait for processing

status_response = requests.get(
    f"{BASE_URL}/campaigns/{campaign_id}",
    auth=AUTH
)

print(status_response.json())
```

## 📁 Project Structure

```
headless-content-delivery/
├── api/                        # Core API Files
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── auth.py                 # Authentication
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   └── database.py             # Database setup
├── services/                   # Service Files
│   ├── __init__.py
│   ├── celery_app.py          # Celery configuration
│   ├── tasks.py               # Celery tasks
│   ├── image_service.py       # Image processing service
│   └── adobe_firefly_service.py # Adobe Firefly integration
├── config.py                   # Configuration settings
├── requirements.txt            # Python dependencies
├── setup_mysql.sql            # MySQL setup script
├── env.example                 # Environment variables example
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
└── storage/                    # Image storage (created at runtime)
    ├── uploads/                # Temporary uploads
    └── generated/              # Processed images
```

## 🐳 Docker Deployment (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: campaigns_db
      MYSQL_USER: campaign_user
      MYSQL_PASSWORD: campaignpass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - mysql
      - redis
    environment:
      DATABASE_URL: mysql+pymysql://campaign_user:campaignpass@mysql:3306/campaigns_db
      REDIS_URL: redis://redis:6379/0
    volumes:
      - ./storage:/app/storage

  celery:
    build: .
    command: celery -A celery_app worker --loglevel=info
    depends_on:
      - mysql
      - redis
    environment:
      DATABASE_URL: mysql+pymysql://campaign_user:campaignpass@mysql:3306/campaigns_db
      REDIS_URL: redis://redis:6379/0
    volumes:
      - ./storage:/app/storage

volumes:
  mysql_data:
```

## 🔧 Configuration Options

### Image Processing

- **Aspect Ratios**: 1:1, 9:16, 16:9 (configurable in `image_service.py`)
- **Image Quality**: JPEG quality 95% (configurable)
- **Standard Sizes**:
  - 1:1 → 1080x1080px
  - 9:16 → 1080x1920px
  - 16:9 → 1920x1080px

### Celery Settings

- **Task Timeout**: 1 hour (3600s)
- **Soft Timeout**: 55 minutes (3300s)
- **Worker Prefetch**: 1 task at a time
- **Max Tasks Per Child**: 1000

### Database Connection Pool

- **Pool Size**: 10 connections
- **Max Overflow**: 20 connections
- **Pool Timeout**: 30 seconds
- **Connection Recycle**: 1 hour

## 🐛 Troubleshooting

### MySQL Connection Issues

```bash
# Check MySQL is running
mysql -u campaign_user -p

# Verify database exists
SHOW DATABASES;
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Celery Worker Not Processing

```bash
# Check Redis connection
celery -A services.celery_app inspect ping

# Check active tasks
celery -A services.celery_app inspect active

# Purge all tasks (careful!)
celery -A services.celery_app purge
```

### Adobe Firefly API Issues

If Adobe Firefly credentials are not configured, the system will create placeholder images instead. To use actual AI generation:

1. Sign up for Adobe Firefly API access
2. Get your credentials from Adobe Developer Console
3. Update `.env` with your credentials

## 📝 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue in the repository.

