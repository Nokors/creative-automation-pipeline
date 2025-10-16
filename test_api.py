#!/usr/bin/env python3
"""
Simple test script for the Marketing Campaign API
Run this after starting the API and Celery worker
"""

import requests
from requests.auth import HTTPBasicAuth
import time
import sys

BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "changeme"

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_create_campaign():
    """Test campaign creation"""
    print("\n📝 Creating test campaign...")
    
    campaign_data = {
        "description": "Test Campaign - Automated Test",
        "target_market": "Test market for API validation",
        "campaign_message": "This is a test campaign message for API testing",
        "products_description": "Test products for automated API testing",
        "image_metadata": {
            "source_type": "ai_generated",
            "ai_prompt": "A simple professional business image for testing"
        },
        "generate_by_ai": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/campaigns",
            json=campaign_data,
            auth=HTTPBasicAuth(USERNAME, PASSWORD)
        )
        
        if response.status_code == 202:
            campaign = response.json()
            campaign_id = campaign["id"]
            print(f"✅ Campaign created: {campaign_id}")
            return campaign_id
        else:
            print(f"❌ Campaign creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Campaign creation error: {str(e)}")
        return None

def test_get_campaign(campaign_id, max_wait=60):
    """Test getting campaign status"""
    print(f"\n🔍 Checking campaign status (max wait: {max_wait}s)...")
    
    start_time = time.time()
    
    try:
        while time.time() - start_time < max_wait:
            response = requests.get(
                f"{BASE_URL}/campaigns/{campaign_id}",
                auth=HTTPBasicAuth(USERNAME, PASSWORD)
            )
            
            if response.status_code == 200:
                campaign = response.json()
                status = campaign["status"]
                
                print(f"   Status: {status}")
                
                if status == "completed":
                    print("✅ Campaign completed successfully!")
                    print(f"   Processed images:")
                    for ratio, path in campaign.get("processed_images", {}).items():
                        print(f"     - {ratio}: {path}")
                    return True
                elif status == "failed":
                    print(f"❌ Campaign failed: {campaign.get('error_message')}")
                    return False
                else:
                    time.sleep(2)  # Wait 2 seconds before checking again
            else:
                print(f"❌ Get campaign failed: {response.status_code}")
                return False
        
        print(f"⏱️  Timeout waiting for campaign completion")
        return False
    except Exception as e:
        print(f"❌ Get campaign error: {str(e)}")
        return False

def test_list_campaigns():
    """Test listing campaigns"""
    print("\n📋 Listing campaigns...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/campaigns?limit=5",
            auth=HTTPBasicAuth(USERNAME, PASSWORD)
        )
        
        if response.status_code == 200:
            campaigns = response.json()
            print(f"✅ Retrieved {len(campaigns)} campaigns")
            for i, campaign in enumerate(campaigns[:3], 1):
                print(f"   {i}. {campaign['id']} - {campaign['status']}")
            return True
        else:
            print(f"❌ List campaigns failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ List campaigns error: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🧪 Marketing Campaign API - Test Suite")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ API is not running or not healthy")
        print("   Please start the API with: uvicorn main:app --reload")
        sys.exit(1)
    
    # Test 2: Create campaign
    campaign_id = test_create_campaign()
    if not campaign_id:
        print("\n❌ Campaign creation failed")
        sys.exit(1)
    
    # Test 3: Get campaign status
    if not test_get_campaign(campaign_id):
        print("\n⚠️  Campaign processing issue (might be async - check Celery worker)")
    
    # Test 4: List campaigns
    test_list_campaigns()
    
    print("\n" + "=" * 50)
    print("✅ Test suite completed!")
    print("\n💡 Tips:")
    print("   - Check the API docs: http://localhost:8000/docs")
    print("   - View campaign images in: ./storage/generated/")
    print("   - Make sure Celery worker is running for async processing")

if __name__ == "__main__":
    main()

