# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
│  (cURL, Python, JavaScript, Postman, Browser)                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Basic Auth
                            │ JSON Request/Response
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI REST API                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth       │  │  Validation  │  │  Endpoints   │          │
│  │ Middleware   │→ │  (Pydantic)  │→ │  Handler     │          │
│  └──────────────┘  └──────────────┘  └──────┬───────┘          │
└────────────────────────────────────────────┬─┴──────────────────┘
                                             │  │
                    ┌────────────────────────┘  └───────────────┐
                    ▼                                           ▼
         ┌──────────────────────┐                    ┌──────────────────┐
         │   MySQL Database     │                    │  Redis Queue     │
         │  ┌────────────────┐  │                    │ ┌──────────────┐ │
         │  │   campaigns    │  │                    │ │ Celery Tasks │ │
         │  │   - id         │  │                    │ └──────────────┘ │
         │  │   - description│  │                    └────────┬─────────┘
         │  │   - images     │  │                             │
         │  │   - status     │  │                             │
         │  └────────────────┘  │                             ▼
         └──────────────────────┘              ┌─────────────────────────┐
                                               │   Celery Worker(s)      │
                                               │  ┌──────────────────┐   │
                                               │  │ Process Campaign │   │
                                               │  └────────┬─────────┘   │
                                               └───────────┼─────────────┘
                                                           │
                    ┌──────────────────────────────────────┼─────────────────┐
                    │                                      │                 │
                    ▼                                      ▼                 ▼
         ┌────────────────────┐             ┌──────────────────────┐  ┌──────────────┐
         │  Image Processor   │             │ Adobe Firefly API    │  │   Dropbox    │
         │  ┌──────────────┐  │             │  (AI Generation)     │  │     API      │
         │  │ Download     │  │             └──────────────────────┘  └──────────────┘
         │  │ Resize       │  │
         │  │ Crop         │  │                         │
         │  │ 3 Variations │  │                         │
         │  └──────────────┘  │                         ▼
         └─────────┬──────────┘              ┌─────────────────────┐
                   │                         │  Local File System  │
                   │                         │   /storage/         │
                   └────────────────────────→│  ┌────────────────┐ │
                                             │  │   uploads/     │ │
                                             │  │   generated/   │ │
                                             │  │   - 1:1        │ │
                                             │  │   - 9:16       │ │
                                             │  │   - 16:9       │ │
                                             │  └────────────────┘ │
                                             └─────────────────────┘
```

## Request Flow

### 1. Campaign Creation Flow

```
Client
  │
  ├─→ POST /campaigns
  │   └─→ Headers: Authorization: Basic xxx
  │       Body: {campaign_data}
  │
  ▼
FastAPI
  │
  ├─→ Authenticate (auth.py)
  │   └─→ Verify username/password
  │
  ├─→ Validate (schemas.py)
  │   └─→ Check all required fields
  │   └─→ Validate image_metadata
  │
  ├─→ Save to MySQL (models.py)
  │   └─→ INSERT campaign (status: pending)
  │
  ├─→ Queue Task (tasks.py)
  │   └─→ Celery task: process_campaign_task.delay(id)
  │
  └─→ Return 202 Accepted
      └─→ {id, status: "pending"}
```

### 2. Async Processing Flow

```
Redis Queue
  │
  ├─→ Celery Worker picks task
  │
  ▼
Process Campaign Task
  │
  ├─→ Update status: "processing"
  │
  ├─→ Get image based on source_type:
  │   ├─→ local: Copy from filesystem
  │   ├─→ dropbox: Download via API
  │   └─→ ai_generated: Generate via Firefly
  │
  ├─→ Image Processing Service
  │   ├─→ Load source image
  │   ├─→ For each ratio (1:1, 9:16, 16:9):
  │   │   ├─→ Calculate crop dimensions
  │   │   ├─→ Crop to aspect ratio
  │   │   └─→ Resize to target size
  │   └─→ Save all variations
  │
  ├─→ Update MySQL:
  │   ├─→ processed_images: {paths}
  │   ├─→ status: "completed"
  │   └─→ completed_at: timestamp
  │
  └─→ Task Complete
```

### 3. Status Check Flow

```
Client
  │
  ├─→ GET /campaigns/{id}
  │   └─→ Headers: Authorization: Basic xxx
  │
  ▼
FastAPI
  │
  ├─→ Authenticate
  │
  ├─→ Query MySQL
  │   └─→ SELECT * WHERE id = ?
  │
  └─→ Return 200 OK
      └─→ {campaign with current status}
```

## Component Details

### FastAPI Application (main.py)
- **Port**: 8000
- **Endpoints**: 5 routes
- **Middleware**: CORS, Basic Auth
- **Auto-docs**: /docs, /redoc

### Authentication (auth.py)
- **Type**: HTTP Basic
- **Algorithm**: Constant-time comparison
- **Storage**: Environment variables

### Database (MySQL)
- **Engine**: SQLAlchemy 2.0
- **Pool**: 10 base + 20 overflow
- **Health**: pool_pre_ping enabled
- **Tables**: 1 (campaigns)

### Queue System (Celery + Redis)
- **Broker**: Redis
- **Backend**: Redis
- **Workers**: Scalable (1-N)
- **Timeout**: 1 hour per task

### Image Processing
- **Library**: Pillow (PIL)
- **Formats**: JPEG (95% quality)
- **Ratios**: 1:1, 9:16, 16:9
- **Algorithm**: Smart crop + resize

### AI Generation (Adobe Firefly)
- **API**: REST API
- **Auth**: OAuth 2.0
- **Fallback**: Placeholder images
- **Size**: 2048x2048 base

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    DATA STATES                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Request → Validation → Pydantic Schema               │
│                                                           │
│  2. Validated → Storage → MySQL (pending)                │
│                                                           │
│  3. Pending → Queue → Redis Task                         │
│                                                           │
│  4. Processing → Worker → Update MySQL                   │
│                                                           │
│  5. Source Image → Temp Storage → /uploads               │
│                                                           │
│  6. Image Processing → 3 Variations → /generated         │
│                                                           │
│  7. Variations → Paths → MySQL (completed)               │
│                                                           │
│  8. Response → Client → JSON with paths                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│         Security Layers                      │
├─────────────────────────────────────────────┤
│                                              │
│  Layer 1: Network                           │
│  └─→ HTTPS (recommended in production)      │
│                                              │
│  Layer 2: Authentication                    │
│  └─→ HTTP Basic Auth                        │
│      └─→ Constant-time comparison           │
│                                              │
│  Layer 3: Validation                        │
│  └─→ Pydantic schemas                       │
│      └─→ Type checking                      │
│      └─→ Length validation                  │
│      └─→ Custom validators                  │
│                                              │
│  Layer 4: Database                          │
│  └─→ SQLAlchemy ORM                         │
│      └─→ SQL injection protection           │
│      └─→ Parameterized queries              │
│                                              │
│  Layer 5: Environment                       │
│  └─→ .env configuration                     │
│      └─→ Secrets not in code                │
│                                              │
└─────────────────────────────────────────────┘
```

## Scalability Model

```
                    Load Balancer (Optional)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   API Worker 1      API Worker 2      API Worker 3
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
                  MySQL         Redis
                    │             │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  Celery Worker 1   Celery Worker 2   Celery Worker 3
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                  Shared File Storage
                    (NFS/S3/EFS)
```

## Technology Stack

```
┌─────────────────────────────────────────────┐
│              Application Layer               │
│  FastAPI 0.104 + Uvicorn 0.24               │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│              Business Logic                  │
│  Pydantic 2.5 + Custom Services             │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│              Task Queue                      │
│  Celery 5.3 + Redis 5.0                     │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│              Data Layer                      │
│  SQLAlchemy 2.0 + PyMySQL 1.1               │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│              Storage Layer                   │
│  MySQL 8.0 + Local Filesystem               │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│              External Services               │
│  Adobe Firefly + Dropbox                    │
└─────────────────────────────────────────────┘
```

## Deployment Architecture

### Docker Compose Deployment

```
┌────────────────────────────────────────────┐
│         Docker Compose Network             │
│                                            │
│  ┌────────────┐  ┌────────────┐          │
│  │   MySQL    │  │   Redis    │          │
│  │  Port 3306 │  │  Port 6379 │          │
│  └──────┬─────┘  └──────┬─────┘          │
│         │                │                 │
│  ┌──────┴────────────────┴─────┐          │
│  │                              │          │
│  │  ┌────────────┐  ┌─────────────┐       │
│  │  │  API       │  │  Celery     │       │
│  │  │ Port 8000  │  │  Worker     │       │
│  │  └────────────┘  └─────────────┘       │
│  │                                         │
│  │  Shared Volume: ./storage              │
│  └─────────────────────────────────────────┘
│                                            │
└────────────────────────────────────────────┘
```

## Performance Characteristics

| Component | Metric | Value |
|-----------|--------|-------|
| API Response Time | Avg (simple GET) | ~50ms |
| Campaign Creation | Time to 202 | ~100ms |
| Image Processing | Per campaign | 5-30s |
| AI Generation | Per image | 10-60s |
| Database Pool | Connections | 10 + 20 overflow |
| Queue Throughput | Tasks/min | 60+ |
| Image Variations | Per campaign | 3 files |
| Storage | Per campaign | ~5-15MB |

## Monitoring Points

```
┌─────────────────────────────────────┐
│      Key Monitoring Metrics         │
├─────────────────────────────────────┤
│                                     │
│  API Layer:                         │
│  • Request rate                     │
│  • Response time (p50, p95, p99)   │
│  • Error rate (4xx, 5xx)           │
│  • Active connections               │
│                                     │
│  Queue Layer:                       │
│  • Queue depth                      │
│  • Task processing time             │
│  • Failed tasks                     │
│  • Worker utilization               │
│                                     │
│  Database Layer:                    │
│  • Connection pool usage            │
│  • Query performance                │
│  • Lock contention                  │
│  • Storage usage                    │
│                                     │
│  Storage Layer:                     │
│  • Disk usage                       │
│  • I/O operations                   │
│  • File count                       │
│                                     │
└─────────────────────────────────────┘
```

## Error Handling Flow

```
Error Occurs
    │
    ├─→ Application Error
    │   ├─→ Try/Catch
    │   ├─→ Log Error
    │   ├─→ Update Campaign Status: "failed"
    │   ├─→ Store Error Message
    │   └─→ Return 500 Response
    │
    ├─→ Validation Error
    │   ├─→ Pydantic Validation
    │   ├─→ Return 422 Response
    │   └─→ Include Field Details
    │
    ├─→ Authentication Error
    │   ├─→ Invalid Credentials
    │   └─→ Return 401 Response
    │
    └─→ Not Found Error
        ├─→ Resource Missing
        └─→ Return 404 Response
```

---

**Architecture Version**: 1.0

**Last Updated**: October 10, 2025

**Status**: Production Ready ✅

