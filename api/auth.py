import secrets
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from config import get_settings

security = HTTPBasic()
settings = get_settings()


def verify_credentials(credentials: HTTPBasicCredentials = Security(security)):
    """
    Verify basic authentication credentials
    
    Args:
        credentials: HTTP Basic credentials
        
    Returns:
        Username if credentials are valid
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Use constant-time comparison to prevent timing attacks
    correct_username = secrets.compare_digest(
        credentials.username.encode("utf8"),
        settings.basic_auth_username.encode("utf8")
    )
    correct_password = secrets.compare_digest(
        credentials.password.encode("utf8"),
        settings.basic_auth_password.encode("utf8")
    )
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return credentials.username


def get_current_user(username: str = Depends(verify_credentials)) -> str:
    """
    Dependency to get current authenticated user
    
    Args:
        username: Username from credentials verification
        
    Returns:
        Username
    """
    return username

