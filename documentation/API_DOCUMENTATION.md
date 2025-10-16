# API Documentation

## Overview

The Marketing Campaign API provides endpoints for creating and managing marketing campaigns with automatic image processing and AI generation capabilities.

**Base URL**: `http://localhost:8000`

**Authentication**: HTTP Basic Auth (all endpoints except health checks)

## Authentication

All API endpoints (except health checks) require HTTP Basic Authentication.

```http
Authorization: Basic base64(username:password)
```

Default credentials (change in production):
- Username: `admin`
- Password: `changeme`

### Example

```bash
curl -u admin:changeme http://localhost:8000/campaigns
```

## Endpoints

### 1. Health Check

Check if the API is online.

**Endpoint**: `GET /`

**Authentication**: None

**Response**: `200 OK`

```json
{
  "status": "online",
  "service": "Marketing Campaign API",
  "version": "1.0.0"
}
```

---

### 2. Detailed Health Check

Get detailed health information.

**Endpoint**: `GET /health`

**Authentication**: None

**Response**: `200 OK`

```json
{
  "status": "healthy",
  "database": "connected",
  "storage": "ready"
}
```

---

### 3. Create Campaign

Create a new marketing campaign (processed asynchronously).

**Endpoint**: `POST /campaigns`

**Authentication**: Required

**Content-Type**: `application/json`

#### Request Body

```json
{
  "description": "string (10-5000 chars)",
  "target_market": "string (5-500 chars)",
  "campaign_message": "string (10-5000 chars)",
  "products_description": "string (10-5000 chars)",
  "image_metadata": {
    "source_type": "local|dropbox|ai_generated",
    "source_path": "string (optional)",
    "dropbox_link": "string (optional)",
    "ai_prompt": "string (optional)"
  },
  "generate_by_ai": "boolean"
}
```

#### Image Source Types

##### 1. Local File

```json
{
  "image_metadata": {
    "source_type": "local",
    "source_path": "/path/to/local/image.jpg"
  },
  "generate_by_ai": false
}
```

##### 2. Dropbox Link

```json
{
  "image_metadata": {
    "source_type": "dropbox",
    "source_path": "https://www.dropbox.com/s/xxxxx/image.jpg?dl=0"
  },
  "generate_by_ai": false
}
```

##### 3. AI Generated (Adobe Firefly)

```json
{
  "image_metadata": {
    "source_type": "ai_generated",
    "ai_prompt": "A professional marketing image showing happy customers"
  },
  "generate_by_ai": true
}
```

#### Response: `202 Accepted`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Campaign creation initiated. Processing asynchronously."
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "detail": "Invalid credentials"
}
```

**422 Validation Error**
```json
{
  "detail": [
    {
      "loc": ["body", "description"],
      "msg": "ensure this value has at least 10 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

**500 Internal Server Error**
```json
{
  "detail": "Failed to create campaign: error message"
}
```

---

### 4. Get Campaign by ID

Retrieve campaign details and processing status.

**Endpoint**: `GET /campaigns/{campaign_id}`

**Authentication**: Required

**Path Parameters**:
- `campaign_id` (string, required): UUID of the campaign

#### Response: `200 OK`

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

#### Campaign Status Values

- `pending`: Campaign created, waiting for processing
- `processing`: Currently being processed
- `completed`: Processing completed successfully
- `failed`: Processing failed (see `error_message`)
- `active`: Campaign is live and running

#### Error Responses

**404 Not Found**
```json
{
  "detail": "Campaign with id 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

---

### 5. List Campaigns

Get a list of all campaigns with optional filtering.

**Endpoint**: `GET /campaigns`

**Authentication**: Required

**Query Parameters**:
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Maximum records to return (default: 100)
- `status_filter` (string, optional): Filter by status (`pending`, `processing`, `completed`, `failed`, `active`)

#### Example Requests

```bash
# Get first 10 campaigns
GET /campaigns?limit=10

# Get next 10 campaigns (pagination)
GET /campaigns?skip=10&limit=10

# Get only completed campaigns
GET /campaigns?status_filter=completed

# Get failed campaigns
GET /campaigns?status_filter=failed&limit=50
```

#### Response: `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Campaign 1",
    "target_market": "Market 1",
    "campaign_message": "Message 1",
    "products_description": "Products 1",
    "image_metadata": {...},
    "generate_by_ai": "true",
    "processed_images": {...},
    "status": "completed",
    "error_message": null,
    "created_at": "2025-10-10T12:00:00",
    "updated_at": "2025-10-10T12:05:30",
    "completed_at": "2025-10-10T12:05:30"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "description": "Campaign 2",
    ...
  }
]
```

#### Error Responses

**400 Bad Request**
```json
{
  "detail": "Invalid status filter: invalid_status"
}
```

---

## Image Processing

### Aspect Ratios

All uploaded or generated images are automatically processed into three variations:

1. **1:1 (Square)** - 1080x1080px
   - Perfect for: Instagram posts, Facebook posts, Twitter images
   
2. **9:16 (Vertical)** - 1080x1920px
   - Perfect for: Instagram Stories, Facebook Stories, TikTok, Snapchat
   
3. **16:9 (Horizontal)** - 1920x1080px
   - Perfect for: YouTube thumbnails, website banners, LinkedIn posts

### Processing Flow

1. **Campaign Created** → Status: `pending`
2. **Image Acquisition**:
   - **Local**: Copy from file system
   - **Dropbox**: Download from shared link
   - **AI**: Generate using Adobe Firefly
3. **Status Updated** → `processing`
4. **Create Variations**: Resize and crop to all three ratios
5. **Status Updated** → `completed` (or `failed` on error)

### Storage Structure

```
storage/
├── uploads/                 # Temporary source images
│   └── {campaign_id}_source_*.jpg
└── generated/               # Processed variations
    └── {campaign_id}/
        ├── {campaign_id}_1_1.jpg
        ├── {campaign_id}_9_16.jpg
        └── {campaign_id}_16_9.jpg
```

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `202 Accepted`: Campaign creation accepted for async processing
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "detail": "Error description",
  "error_type": "ErrorType (optional)"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider adding:

- Rate limiting middleware
- Request throttling per IP/user
- Queue size limits for Celery

---

## Code Examples

### Python Example

```python
import requests
from requests.auth import HTTPBasicAuth
import time

BASE_URL = "http://localhost:8000"
AUTH = HTTPBasicAuth("admin", "changeme")

# Create campaign
campaign_data = {
    "description": "Holiday Season Campaign 2025",
    "target_market": "Families with children aged 5-12",
    "campaign_message": "Create magical holiday memories!",
    "products_description": "Holiday toys, decorations, and gifts",
    "image_metadata": {
        "source_type": "ai_generated",
        "ai_prompt": "Joyful family celebrating holidays with gifts and decorations"
    },
    "generate_by_ai": True
}

# Create the campaign
response = requests.post(
    f"{BASE_URL}/campaigns",
    json=campaign_data,
    auth=AUTH
)

if response.status_code == 202:
    campaign = response.json()
    campaign_id = campaign["id"]
    print(f"Campaign created: {campaign_id}")
    
    # Poll for completion
    while True:
        status_response = requests.get(
            f"{BASE_URL}/campaigns/{campaign_id}",
            auth=AUTH
        )
        
        campaign_status = status_response.json()
        status = campaign_status["status"]
        
        print(f"Status: {status}")
        
        if status == "completed":
            print("Campaign completed!")
            print(f"Images: {campaign_status['processed_images']}")
            break
        elif status == "failed":
            print(f"Campaign failed: {campaign_status['error_message']}")
            break
        
        time.sleep(2)  # Wait 2 seconds before checking again
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

### JavaScript Example

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const AUTH = {
  username: 'admin',
  password: 'changeme'
};

async function createCampaign() {
  try {
    const campaignData = {
      description: 'Tech Product Launch Campaign',
      target_market: 'Tech enthusiasts aged 25-45',
      campaign_message: 'Experience the future of technology!',
      products_description: 'Latest smartphones and smart devices',
      image_metadata: {
        source_type: 'ai_generated',
        ai_prompt: 'Modern technology products with futuristic design'
      },
      generate_by_ai: true
    };

    // Create campaign
    const response = await axios.post(
      `${BASE_URL}/campaigns`,
      campaignData,
      { auth: AUTH }
    );

    const campaignId = response.data.id;
    console.log(`Campaign created: ${campaignId}`);

    // Poll for completion
    let completed = false;
    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `${BASE_URL}/campaigns/${campaignId}`,
        { auth: AUTH }
      );

      const status = statusResponse.data.status;
      console.log(`Status: ${status}`);

      if (status === 'completed') {
        console.log('Campaign completed!');
        console.log('Images:', statusResponse.data.processed_images);
        completed = true;
      } else if (status === 'failed') {
        console.log('Campaign failed:', statusResponse.data.error_message);
        completed = true;
      }
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createCampaign();
```

### cURL Examples

```bash
# Create campaign with AI generation
curl -X POST http://localhost:8000/campaigns \
  -u admin:changeme \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Spring Collection 2025",
    "target_market": "Fashion-conscious millennials",
    "campaign_message": "Refresh your wardrobe this spring!",
    "products_description": "Spring fashion collection with vibrant colors",
    "image_metadata": {
      "source_type": "ai_generated",
      "ai_prompt": "Spring fashion with colorful clothing and flowers"
    },
    "generate_by_ai": true
  }'

# Get campaign by ID
curl -X GET http://localhost:8000/campaigns/550e8400-e29b-41d4-a716-446655440000 \
  -u admin:changeme

# List all completed campaigns
curl -X GET "http://localhost:8000/campaigns?status_filter=completed" \
  -u admin:changeme

# List with pagination
curl -X GET "http://localhost:8000/campaigns?skip=0&limit=10" \
  -u admin:changeme
```

---

## Interactive API Documentation

FastAPI provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
  - Interactive API explorer
  - Test endpoints directly from browser
  - View request/response schemas

- **ReDoc**: http://localhost:8000/redoc
  - Clean, searchable documentation
  - Code samples
  - Detailed schemas

---

## Best Practices

1. **Always check campaign status** after creation before assuming completion
2. **Implement polling or webhooks** for status updates in production
3. **Handle failed campaigns** gracefully with retry logic
4. **Validate image sources** before submission to avoid processing errors
5. **Use appropriate status filters** when listing campaigns for better performance
6. **Implement proper error handling** for network issues and timeouts
7. **Store campaign IDs** for future reference and tracking

---

## Support

For issues and questions:
- Check the main README.md
- Review the troubleshooting section
- Open an issue in the repository

