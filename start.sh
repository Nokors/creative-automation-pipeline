#!/bin/bash

# Marketing Campaign API - Quick Start Script
# This script helps you start all required services

set -e

echo "🚀 Starting Marketing Campaign API..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env file. Please update with your credentials.${NC}"
    else
        echo -e "${RED}❌ env.example not found!${NC}"
        exit 1
    fi
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check if Redis is running
echo "🔍 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Redis is not running!${NC}"
    echo "Please start Redis with: redis-server"
    echo "Or with Docker: docker run -d -p 6379:6379 redis:latest"
    exit 1
else
    echo -e "${GREEN}✅ Redis is running${NC}"
fi

# Check MySQL connection (optional - will fail gracefully if not configured)
echo "🔍 Checking MySQL..."
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✅ MySQL client found${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL client not found. Make sure MySQL is configured.${NC}"
fi

# Initialize database
echo "🗄️  Initializing database..."
python -c "from api.database import init_db; init_db()" 2>/dev/null || echo -e "${YELLOW}⚠️  Database initialization failed. Check your database configuration.${NC}"

# Create storage directories
echo "📁 Creating storage directories..."
mkdir -p storage/uploads storage/generated
echo -e "${GREEN}✅ Storage directories created${NC}"

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "To start the services, run:"
echo ""
echo -e "${YELLOW}Terminal 1 - Start Celery Worker:${NC}"
echo "  celery -A services.celery_app worker --loglevel=info"
echo ""
echo -e "${YELLOW}Terminal 2 - Start API Server:${NC}"
echo "  uvicorn api.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo -e "Or use Docker Compose:${NC}"
echo "  docker-compose up"
echo ""
echo "📖 Documentation available at: http://localhost:8000/docs"
echo ""

