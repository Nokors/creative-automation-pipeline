import re
from typing import List, Dict, Optional
from config import get_settings

settings = get_settings()


class ContentValidator:
    """Service for validating content against prohibited words"""
    
    def __init__(self, custom_prohibited_words: Optional[List[str]] = None):
        """
        Initialize content validator
        
        Args:
            custom_prohibited_words: Optional custom list of prohibited words
        """
        self.prohibited_words = custom_prohibited_words or settings.prohibited_words
        # Convert to lowercase for case-insensitive matching
        self.prohibited_words_lower = [word.lower() for word in self.prohibited_words]
    
    def contains_prohibited_words(self, text: str) -> Dict[str, any]:
        """
        Check if text contains any prohibited words
        
        Args:
            text: Text to validate
            
        Returns:
            Dictionary with validation result:
            {
                "is_valid": bool,
                "found_words": List[str],
                "message": str
            }
        """
        if not text:
            return {"is_valid": True, "found_words": [], "message": ""}
        
        text_lower = text.lower()
        found_words = []
        
        for word in self.prohibited_words_lower:
            # Check for whole word matches (with word boundaries)
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, text_lower):
                # Find the original case word
                original_word = self.prohibited_words[self.prohibited_words_lower.index(word)]
                found_words.append(original_word)
        
        if found_words:
            return {
                "is_valid": False,
                "found_words": found_words,
                "message": f"Content contains prohibited words: {', '.join(found_words)}"
            }
        
        return {"is_valid": True, "found_words": [], "message": ""}
    
    def validate_campaign_content(
        self,
        description: str,
        campaign_message: str,
        products_description: str,
        target_market: str
    ) -> Dict[str, any]:
        """
        Validate all campaign text fields
        
        Args:
            description: Campaign description
            campaign_message: Campaign message
            products_description: Products description
            target_market: Target market
            
        Returns:
            Dictionary with validation result:
            {
                "is_valid": bool,
                "violations": Dict[str, List[str]],
                "message": str
            }
        """
        violations = {}
        
        # Check description
        desc_result = self.contains_prohibited_words(description)
        if not desc_result["is_valid"]:
            violations["description"] = desc_result["found_words"]
        
        # Check campaign message
        msg_result = self.contains_prohibited_words(campaign_message)
        if not msg_result["is_valid"]:
            violations["campaign_message"] = msg_result["found_words"]
        
        # Check products description
        prod_result = self.contains_prohibited_words(products_description)
        if not prod_result["is_valid"]:
            violations["products_description"] = prod_result["found_words"]
        
        # Check target market
        market_result = self.contains_prohibited_words(target_market)
        if not market_result["is_valid"]:
            violations["target_market"] = market_result["found_words"]
        
        if violations:
            # Build detailed error message
            error_parts = []
            for field, words in violations.items():
                error_parts.append(f"{field}: {', '.join(words)}")
            
            return {
                "is_valid": False,
                "violations": violations,
                "message": f"Prohibited words found in {'; '.join(error_parts)}"
            }
        
        return {
            "is_valid": True,
            "violations": {},
            "message": "Content validation passed"
        }


# Singleton instance
_validator = None


def get_content_validator() -> ContentValidator:
    """Get content validator singleton instance"""
    global _validator
    if _validator is None:
        _validator = ContentValidator()
    return _validator

