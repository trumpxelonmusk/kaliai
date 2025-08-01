#!/usr/bin/env python3
"""
Test script to verify Security AI frontend-backend integration
"""

import requests
import json
import time

def test_backend_connection():
    """Test if the backend is running and accessible"""
    try:
        response = requests.get("http://localhost:8000/")
        print("✅ Backend is running")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start your Security AI backend first.")
        return False

def test_api_endpoint():
    """Test the main API endpoint"""
    try:
        # Test non-streaming request
        data = {
            "question": "What is SQL injection?",
            "session_id": "test_session",
            "stream": False
        }
        
        response = requests.post(
            "http://localhost:8000/api/query",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API endpoint working")
            print(f"   Response: {result.get('answer', 'No answer field')[:100]}...")
            return True
        else:
            print(f"❌ API endpoint returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API endpoint test failed: {e}")
        return False

def test_streaming_endpoint():
    """Test streaming endpoint"""
    try:
        data = {
            "question": "Explain XSS attacks",
            "session_id": "test_streaming",
            "stream": True
        }
        
        response = requests.post(
            "http://localhost:8000/api/query",
            json=data,
            headers={"Content-Type": "application/json"},
            stream=True
        )
        
        if response.status_code == 200:
            print("✅ Streaming endpoint working")
            print("   Receiving streaming data...")
            
            # Read a few chunks to verify streaming
            chunk_count = 0
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    chunk_count += 1
                    if chunk_count <= 3:  # Only show first 3 chunks
                        print(f"   Chunk {chunk_count}: {chunk.decode()[:50]}...")
                    if chunk_count >= 5:  # Stop after 5 chunks
                        break
            
            return True
        else:
            print(f"❌ Streaming endpoint returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Streaming endpoint test failed: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    try:
        response = requests.options(
            "http://localhost:8000/api/query",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        
        if response.status_code == 200:
            print("✅ CORS is properly configured")
            return True
        else:
            print(f"❌ CORS test failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🔍 Testing Security AI Frontend-Backend Integration")
    print("=" * 50)
    
    tests = [
        ("Backend Connection", test_backend_connection),
        ("API Endpoint", test_api_endpoint),
        ("Streaming Endpoint", test_streaming_endpoint),
        ("CORS Configuration", test_cors),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 Testing: {test_name}")
        print("-" * 30)
        
        if test_func():
            passed += 1
        else:
            print(f"   ⚠️  {test_name} test failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your frontend should work correctly.")
        print("\n📝 Next steps:")
        print("   1. Open index.html in your browser")
        print("   2. Configure API endpoint to: http://localhost:8000/api/query")
        print("   3. Start chatting with your Security AI!")
    else:
        print("⚠️  Some tests failed. Please check your backend configuration.")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure your Security AI backend is running")
        print("   2. Verify the API endpoints are correct")
        print("   3. Check CORS configuration")
        print("   4. Review backend logs for errors")

if __name__ == "__main__":
    main() 