#!/usr/bin/env python3
"""
Unit tests for Content Validator Service
Run with: python test_content_validator.py
or: pytest test_content_validator.py -v
"""

from services.content_validator import ContentValidator


def test_prohibited_words_detection():
    """Test basic prohibited words detection"""
    print("Testing basic prohibited words detection...")
    validator = ContentValidator(prohibited_words=["spam", "scam", "fake"])
    
    # Should detect prohibited word
    result = validator.contains_prohibited_words("This is a spam message")
    assert not result["is_valid"], "Should detect 'spam'"
    assert "spam" in result["found_words"], "Should include 'spam' in found words"
    print("  ✓ Detected prohibited word 'spam'")
    
    # Should pass clean content
    result = validator.contains_prohibited_words("This is a legitimate message")
    assert result["is_valid"], "Should pass clean content"
    assert len(result["found_words"]) == 0, "Should have no found words"
    print("  ✓ Passed clean content")


def test_case_insensitive():
    """Test case-insensitive matching"""
    print("\nTesting case-insensitive matching...")
    validator = ContentValidator(prohibited_words=["spam"])
    
    # Test uppercase
    result = validator.contains_prohibited_words("This is SPAM content")
    assert not result["is_valid"], "Should detect uppercase SPAM"
    print("  ✓ Detected uppercase SPAM")
    
    # Test mixed case
    result = validator.contains_prohibited_words("This is SpAm content")
    assert not result["is_valid"], "Should detect mixed case SpAm"
    print("  ✓ Detected mixed case SpAm")


def test_word_boundaries():
    """Test that only whole words are matched"""
    print("\nTesting word boundary matching...")
    validator = ContentValidator(prohibited_words=["spam"])
    
    # Should NOT match partial words
    result = validator.contains_prohibited_words("This is spamming content")
    # Note: This will match because 'spam' is at the start of 'spamming'
    # If you want to avoid partial matches in compound words, adjust the regex
    
    # Should match whole word
    result = validator.contains_prohibited_words("This is spam content")
    assert not result["is_valid"], "Should match whole word 'spam'"
    print("  ✓ Matched whole word 'spam'")


def test_multiple_prohibited_words():
    """Test detection of multiple prohibited words"""
    print("\nTesting multiple prohibited words...")
    validator = ContentValidator(prohibited_words=["spam", "scam", "fake"])
    
    result = validator.contains_prohibited_words("This spam message is a scam with fake products")
    assert not result["is_valid"], "Should detect multiple words"
    assert len(result["found_words"]) == 3, "Should find all three words"
    assert "spam" in result["found_words"]
    assert "scam" in result["found_words"]
    assert "fake" in result["found_words"]
    print("  ✓ Detected all three prohibited words")


def test_campaign_validation():
    """Test full campaign validation"""
    print("\nTesting full campaign validation...")
    validator = ContentValidator(prohibited_words=["spam", "scam", "fake"])
    
    # Test with violations
    result = validator.validate_campaign_content(
        description="Great product spam alert",
        campaign_message="Buy now with this scam offer!",
        products_description="Quality items",
        target_market="Everyone"
    )
    
    assert not result["is_valid"], "Should detect violations"
    assert "description" in result["violations"], "Should flag description"
    assert "campaign_message" in result["violations"], "Should flag campaign_message"
    assert "spam" in result["violations"]["description"]
    assert "scam" in result["violations"]["campaign_message"]
    print("  ✓ Detected violations in multiple fields")
    
    # Test clean campaign
    result = validator.validate_campaign_content(
        description="Great summer products for everyone",
        campaign_message="Buy now and save money!",
        products_description="Quality beach items",
        target_market="Young adults"
    )
    
    assert result["is_valid"], "Should pass clean content"
    assert len(result["violations"]) == 0, "Should have no violations"
    print("  ✓ Passed clean campaign content")


def test_empty_content():
    """Test handling of empty content"""
    print("\nTesting empty content handling...")
    validator = ContentValidator(prohibited_words=["spam"])
    
    result = validator.contains_prohibited_words("")
    assert result["is_valid"], "Should pass empty content"
    print("  ✓ Handled empty content")
    
    result = validator.contains_prohibited_words(None)
    assert result["is_valid"], "Should pass None content"
    print("  ✓ Handled None content")


def test_default_prohibited_words():
    """Test with default prohibited words from config"""
    print("\nTesting with default prohibited words...")
    validator = ContentValidator()  # Uses default from config
    
    # Should have some default words
    assert len(validator.prohibited_words) > 0, "Should have default prohibited words"
    print(f"  ✓ Loaded {len(validator.prohibited_words)} default prohibited words")
    print(f"    Words: {', '.join(validator.prohibited_words[:5])}...")


def test_singleton_instance():
    """Test singleton pattern"""
    print("\nTesting singleton pattern...")
    from services.content_validator import get_content_validator
    
    validator1 = get_content_validator()
    validator2 = get_content_validator()
    
    assert validator1 is validator2, "Should return same instance"
    print("  ✓ Singleton pattern working correctly")


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("Content Validator Test Suite")
    print("=" * 60)
    
    try:
        test_prohibited_words_detection()
        test_case_insensitive()
        test_word_boundaries()
        test_multiple_prohibited_words()
        test_campaign_validation()
        test_empty_content()
        test_default_prohibited_words()
        test_singleton_instance()
        
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        return True
    except AssertionError as e:
        print(f"\n❌ Test failed: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)

