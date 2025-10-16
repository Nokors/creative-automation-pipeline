from celery import Celery
from config import get_settings

settings = get_settings()

# Initialize Celery app
celery_app = Celery(
    'campaign_tasks',
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=['services.tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    task_soft_time_limit=3300,  # Soft limit at 55 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    # Retry configuration
    task_acks_late=True,  # Acknowledge tasks after completion (safer for retries)
    task_reject_on_worker_lost=True,  # Requeue task if worker crashes
    task_default_retry_delay=60,  # Default retry delay: 60 seconds
)

if __name__ == '__main__':
    celery_app.start()

