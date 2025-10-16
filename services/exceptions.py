"""
Custom exceptions for campaign processing
"""


class CampaignProcessingError(Exception):
    """Base exception for campaign processing errors"""
    pass


class RetryableError(CampaignProcessingError):
    """
    Exception for transient errors that should be retried
    
    Examples:
    - Network timeouts
    - API rate limiting
    - Temporary service unavailability
    - Temporary file system issues
    """
    pass


class NonRetryableError(CampaignProcessingError):
    """
    Exception for permanent errors that should not be retried
    
    Examples:
    - File not found
    - Invalid configuration
    - Validation errors
    - Authentication failures
    """
    pass


class ImageNotFoundError(NonRetryableError):
    """Image file not found (permanent error)"""
    pass


class InvalidImageError(NonRetryableError):
    """Invalid image format or corrupted image (permanent error)"""
    pass


class ConfigurationError(NonRetryableError):
    """Invalid configuration or missing required parameters (permanent error)"""
    pass


class NetworkError(RetryableError):
    """Network-related error (transient, should retry)"""
    pass


class ServiceUnavailableError(RetryableError):
    """External service unavailable (transient, should retry)"""
    pass

