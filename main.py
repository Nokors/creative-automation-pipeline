"""
Root-level entry point for backward compatibility
"""
from api.main import app

if __name__ == "__main__":
    import uvicorn
    from config import get_settings
    
    settings = get_settings()
    uvicorn.run(
        "api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )

